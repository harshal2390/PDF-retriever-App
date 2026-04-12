import os
from dotenv import load_dotenv


from app.embeddings.hf_embeddings import EmbeddingFactory
from app.vectorstore.faiss_store import FAISSVectorStore
from app.chains.qa_chain import QAChain


class RAGApplication:
    """
    Main application class to run RAG pipeline.
    Includes memory + source citations + highlighting.
    """

    def __init__(self):
        load_dotenv()

        print("🔄 Initializing RAG Application...")

        # 🔹 Chat memory
        self.chat_history = []

        # 🔹 Load embeddings
        self.embeddings = EmbeddingFactory().load_embeddings()

        # 🔹 Load vector store
        self.vectorstore = FAISSVectorStore()
        self.vectorstore.load(self.embeddings)

        # 🔹 Create QA chain
        self.qa_chain = QAChain(self.vectorstore.db).create_chain()

        print("✅ RAG System Ready!\n")

    def build_context_query(self, query: str) -> str:
        """
        Combine chat history with current query (for memory).
        """

        # keep last 3 exchanges only (to avoid noise)
        history = "\n".join(self.chat_history[-3:])

        return f"{history}\nUser: {query}"

    def ask(self, query: str):
        """
        Ask question to RAG system with memory.
        """

        # 🔹 Build context-aware query
        context_query = self.build_context_query(query)

        # 🔹 Invoke chain
        result = self.qa_chain.invoke(context_query)

        answer = result["answer"].content
        docs = result["docs"]   

        # 🔹 Update memory
        self.chat_history.append(f"User: {query}")
        self.chat_history.append(f"AI: {answer}")

        return answer, docs

    def print_sources(self, docs):
        """
        Print sources with highlighted snippets.
        """

        print("\n📚 Sources:")

        seen = set()

        for i, doc in enumerate(docs, 1):
            source = doc.metadata.get("source", "Unknown")
            page = doc.metadata.get("page", "N/A")

            key = (source, page)

            # avoid duplicate sources
            if key in seen:
                continue
            seen.add(key)

            print(f"\n[{i}] {source} (Page {page})")

            # 🔥 Highlight snippet
            snippet = doc.page_content[:250].replace("\n", " ")
            print(f"→ {snippet}...")


# ===========================
# 🔥 CLI RUNNER
# ===========================
if __name__ == "__main__":

    app = RAGApplication()

    print("💬 Ask your questions (type 'exit' to quit)\n")

    while True:
        query = input("Ask: ").strip()

        if not query:
            continue

        if query.lower() == "exit":
            print("👋 Exiting RAG system...")
            break

        try:
            answer, docs = app.ask(query)

            print("\n📌 Answer:")
            print(answer)

            app.print_sources(docs)

        except Exception as e:
            print("\n❌ Error occurred:")
            print(str(e))

        print("\n" + "=" * 60)