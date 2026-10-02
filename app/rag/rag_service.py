import os
import re
import shutil
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, AsyncGenerator
from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.config.settings import (
    GROQ_API_KEY,
    DEFAULT_MODEL,
    VECTOR_DIR,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_TOP_K
)
from app.embeddings.hf_embeddings import EmbeddingFactory
from app.rag.prompts import RAG_SYSTEM_PROMPT, RAG_USER_TEMPLATE

from app.rag.web_search import search_web

def sanitize_plain_text(text: str) -> str:
    """Strips raw markdown bold/italic asterisks while preserving citations and readable format."""
    cleaned = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    cleaned = re.sub(r'__(.*?)__', r'\1', cleaned)
    cleaned = re.sub(r'^#{1,6}\s+', '', cleaned, flags=re.MULTILINE)
    return cleaned

class RAGService:
    def __init__(self):
        self.embedding_factory = EmbeddingFactory()
        self._embeddings = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = self.embedding_factory.load_embeddings()
        return self._embeddings

    def get_session_vector_path(self, session_id: str) -> Path:
        p = VECTOR_DIR / session_id
        p.mkdir(parents=True, exist_ok=True)
        return p

    def process_pdf(self, file_path: str, doc_id: str, original_name: str) -> Dict[str, Any]:
        """
        Extract text from PDF page by page, split into chunks, and record metrics.
        """
        reader = PdfReader(file_path)
        total_pages = len(reader.pages)
        raw_docs = []

        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                raw_docs.append(Document(
                    page_content=page_text,
                    metadata={
                        "doc_id": doc_id,
                        "source": original_name,
                        "page": idx + 1,  # 1-indexed for citations
                        "total_pages": total_pages
                    }
                ))

        if not raw_docs:
            raise ValueError(f"No extractable text found in '{original_name}'.")

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=DEFAULT_CHUNK_SIZE,
            chunk_overlap=DEFAULT_CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        chunks = splitter.split_documents(raw_docs)
        
        # Add chunk index to metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_id"] = f"{doc_id}_{i}"

        return {
            "total_pages": total_pages,
            "chunks": chunks,
            "chunk_count": len(chunks)
        }

    def index_documents_for_session(self, session_id: str, chunks: List[Document]) -> None:
        """
        Add or create FAISS vector store index for the given session.
        """
        if not chunks:
            return

        vector_path = self.get_session_vector_path(session_id)
        index_file = vector_path / "index.faiss"

        if index_file.exists():
            db = FAISS.load_local(
                str(vector_path),
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            db.add_documents(chunks)
        else:
            db = FAISS.from_documents(chunks, self.embeddings)

        db.save_local(str(vector_path))

    def load_session_vectorstore(self, session_id: str) -> Optional[FAISS]:
        vector_path = self.get_session_vector_path(session_id)
        index_file = vector_path / "index.faiss"
        if not index_file.exists():
            return None
        return FAISS.load_local(
            str(vector_path),
            self.embeddings,
            allow_dangerous_deserialization=True
        )

    def retrieve_context(
        self,
        session_id: str,
        query: str,
        selected_doc_ids: Optional[List[str]] = None,
        top_k: int = DEFAULT_TOP_K,
        use_web_search: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks from vectorstore and live web search results.
        """
        db = self.load_session_vectorstore(session_id)
        filtered_sources = []
        source_idx = 1
        seen_keys = set()

        # 1. Document Vector Search (if vectorstore exists)
        if db:
            has_filter = bool(selected_doc_ids and len(selected_doc_ids) > 0)
            fetch_k = max(top_k * 4 if has_filter else top_k * 2, 12)
            try:
                docs_and_scores = db.similarity_search_with_score(query, k=fetch_k)

                for doc, score in docs_and_scores:
                    doc_id = doc.metadata.get("doc_id")
                    if has_filter and doc_id not in selected_doc_ids:
                        continue

                    snippet = doc.page_content.strip()
                    snippet_key = (doc.metadata.get("source"), doc.metadata.get("page"), snippet[:60])
                    if snippet_key in seen_keys:
                        continue
                    seen_keys.add(snippet_key)

                    filtered_sources.append({
                        "id": source_idx,
                        "is_web": False,
                        "doc_id": doc_id,
                        "document_name": doc.metadata.get("source", "Document"),
                        "page": doc.metadata.get("page", 1),
                        "snippet": snippet,
                        "score": round(float(score), 4)
                    })
                    source_idx += 1
                    if len(filtered_sources) >= top_k:
                        break
            except Exception as e:
                print(f"[RAG] FAISS retrieval error: {str(e)}")

        # 2. Live Web Search Integration
        if use_web_search:
            try:
                web_results = search_web(query, max_results=3)
                for w in web_results:
                    w_title = w.get("title", "Web Result")
                    w_snippet = w.get("snippet", "")
                    w_url = w.get("url", "")
                    
                    if not w_snippet and not w_title:
                        continue

                    filtered_sources.append({
                        "id": source_idx,
                        "is_web": True,
                        "document_name": w_title,
                        "url": w_url,
                        "page": "Web",
                        "snippet": w_snippet,
                        "score": 1.0
                    })
                    source_idx += 1
            except Exception as e:
                print(f"[RAG] Web search error: {str(e)}")

        return filtered_sources

    def format_context_for_llm(self, sources: List[Dict[str, Any]]) -> str:
        if not sources:
            return "No documents or web search excerpts available."
        
        parts = []
        for s in sources:
            if s.get("is_web"):
                parts.append(
                    f"[Web Source {s['id']}] Title: {s['document_name']} | URL: {s.get('url', '')}\n"
                    f"Excerpt:\n{s['snippet']}\n"
                )
            else:
                parts.append(
                    f"[Document Source {s['id']}] Document: {s['document_name']} | Page: {s['page']}\n"
                    f"Excerpt:\n{s['snippet']}\n"
                )
        return "\n---\n".join(parts)

    def get_llm(self, model: Optional[str] = None, streaming: bool = False):
        return ChatGroq(
            api_key=GROQ_API_KEY,
            model=model or DEFAULT_MODEL,
            temperature=0.2,
            streaming=streaming
        )

    async def generate_title_async(self, query: str, answer_snippet: str = "") -> str:
        """
        Generate a concise, smart title (3 to 5 words) for the conversation like ChatGPT.
        """
        prompt = (
            "You are a title generator. Generate an extremely concise, specific, and clear title "
            "(maximum 3 to 5 words) for a chat conversation based on this user question and answer summary.\n"
            "Rules:\n"
            "- Do NOT use quotes, punctuation, asterisks, or markdown.\n"
            "- Do NOT include prefixes like 'Title:' or 'Subject:'.\n"
            "- Respond with ONLY the title.\n\n"
            f"User Question: {query[:300]}"
        )
        if answer_snippet:
            prompt += f"\nAnswer Summary: {answer_snippet[:150]}"
        try:
            llm = self.get_llm(streaming=False)
            res = await llm.ainvoke([HumanMessage(content=prompt)])
            raw_title = res.content.strip().strip('"\'`').replace("\n", " ")
            raw_title = re.sub(r'^(Title|Subject):\s*', '', raw_title, flags=re.IGNORECASE)
            raw_title = sanitize_plain_text(raw_title).strip()
            words = raw_title.split()
            if len(words) > 6:
                raw_title = " ".join(words[:6])
            return raw_title if raw_title else " ".join(query.strip().split()[:5]).capitalize()
        except Exception as e:
            words = query.strip().split()[:5]
            return " ".join(words).capitalize() if words else "Conversation"

    def generate_title(self, query: str, answer_snippet: str = "") -> str:
        """
        Synchronous title generation fallback.
        """
        prompt = (
            "You are a title generator. Generate an extremely concise, specific, and clear title "
            "(maximum 3 to 5 words) for a chat conversation based on this user question and answer summary.\n"
            "Rules:\n"
            "- Do NOT use quotes, punctuation, asterisks, or markdown.\n"
            "- Do NOT include prefixes like 'Title:' or 'Subject:'.\n"
            "- Respond with ONLY the title.\n\n"
            f"User Question: {query[:300]}"
        )
        if answer_snippet:
            prompt += f"\nAnswer Summary: {answer_snippet[:150]}"
        try:
            llm = self.get_llm(streaming=False)
            res = llm.invoke([HumanMessage(content=prompt)])
            raw_title = res.content.strip().strip('"\'`').replace("\n", " ")
            raw_title = re.sub(r'^(Title|Subject):\s*', '', raw_title, flags=re.IGNORECASE)
            raw_title = sanitize_plain_text(raw_title).strip()
            words = raw_title.split()
            if len(words) > 6:
                raw_title = " ".join(words[:6])
            return raw_title if raw_title else " ".join(query.strip().split()[:5]).capitalize()
        except Exception:
            words = query.strip().split()[:5]
            return " ".join(words).capitalize() if words else "Conversation"

    async def stream_query_response(
        self,
        session_id: str,
        query: str,
        chat_history: List[Dict[str, str]],
        selected_doc_ids: Optional[List[str]] = None,
        model: Optional[str] = None,
        top_k: int = DEFAULT_TOP_K,
        use_web_search: bool = True
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields SSE formatted dicts with dual document & web citations
        """
        sources = self.retrieve_context(session_id, query, selected_doc_ids, top_k, use_web_search)

        # Yield sources immediately for the UI
        yield {
            "event": "sources",
            "data": json.dumps({"sources": sources})
        }

        if not sources:
            fallback = "I couldn't find enough information in your selected documents or online search to answer that confidently."
            yield {
                "event": "token",
                "data": json.dumps({"token": fallback})
            }
            yield {
                "event": "done",
                "data": json.dumps({"complete_text": fallback, "sources": []})
            }
            return

        context_str = self.format_context_for_llm(sources)
        history_str = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in chat_history[-6:]]) if chat_history else "None"

        user_content = RAG_USER_TEMPLATE.format(
            context=context_str,
            chat_history=history_str,
            question=query
        )

        messages = [
            SystemMessage(content=RAG_SYSTEM_PROMPT),
            HumanMessage(content=user_content)
        ]

        llm = self.get_llm(model=model, streaming=True)
        complete_text = ""

        try:
            async for chunk in llm.astream(messages):
                token = chunk.content
                complete_text += token
                yield {
                    "event": "token",
                    "data": json.dumps({"token": token})
                }
        except Exception as e:
            err_msg = f"\n\n[Error generating response: {str(e)}]"
            complete_text += err_msg
            yield {
                "event": "token",
                "data": json.dumps({"token": err_msg})
            }

        yield {
            "event": "done",
            "data": json.dumps({
                "complete_text": sanitize_plain_text(complete_text),
                "sources": sources
            })
        }

    def synchronous_query(
        self,
        session_id: str,
        query: str,
        chat_history: List[Dict[str, str]],
        selected_doc_ids: Optional[List[str]] = None,
        model: Optional[str] = None,
        top_k: int = DEFAULT_TOP_K,
        use_web_search: bool = True
    ) -> Dict[str, Any]:
        sources = self.retrieve_context(session_id, query, selected_doc_ids, top_k, use_web_search)
        if not sources:
            return {
                "answer": "I couldn't find enough information in your selected documents or online search to answer that confidently.",
                "sources": []
            }

        context_str = self.format_context_for_llm(sources)
        history_str = "\n".join([f"{m['role'].capitalize()}: {m['content']}" for m in chat_history[-6:]]) if chat_history else "None"

        user_content = RAG_USER_TEMPLATE.format(
            context=context_str,
            chat_history=history_str,
            question=query
        )

        messages = [
            SystemMessage(content=RAG_SYSTEM_PROMPT),
            HumanMessage(content=user_content)
        ]

        llm = self.get_llm(model=model, streaming=False)
        response = llm.invoke(messages)
        return {
            "answer": sanitize_plain_text(response.content),
            "sources": sources
        }

rag_service = RAGService()
