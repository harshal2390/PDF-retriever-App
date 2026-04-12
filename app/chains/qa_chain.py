from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
import os
from dotenv import load_dotenv


class QAChain:
    """
    Production-grade RAG QA Chain (LangChain v1.x compatible)
    """

    def __init__(self, vectorstore):
        load_dotenv()

        self.vectorstore = vectorstore

        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.3-70b-versatile",
            temperature=0.1
        )

    def format_docs(self, docs):
        """
        Convert documents into single context string.
        """
        return "\n\n".join(doc.page_content for doc in docs)

    def create_chain(self):
        """
        Create RAG chain using LCEL (latest LangChain approach)
        """

        # 🔥 STRICT PROMPT
        prompt = ChatPromptTemplate.from_template("""
You are a highly strict and accurate AI assistant.

RULES:
1. Answer ONLY using the provided context.
2. DO NOT use any external knowledge.
3. If the answer is not present, say:
   "I don't know based on the provided documents."
4. DO NOT hallucinate.
5. Keep answers concise (3-5 lines).

Context:
{context}

Question:
{question}

Answer:
""")

        # 🔹 Retriever
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

        # 🔥 LCEL CHAIN (NEW WAY)
        chain = (
            {
                "context": retriever | self.format_docs,
                "question": RunnablePassthrough()
            }
            | prompt
            | self.llm
        )

        return chain


# ===========================
# 🔥 TEST SCRIPT
# ===========================
if __name__ == "__main__":

    from app.vectorstore.faiss_store import FAISSVectorStore
    from app.embeddings.hf_embeddings import EmbeddingFactory

    embeddings = EmbeddingFactory().load_embeddings()

    store = FAISSVectorStore()
    store.load(embeddings)

    qa = QAChain(store.db).create_chain()

    print("\n✅ RAG System Ready. Type 'exit' to quit.\n")

    while True:
        query = input("Ask: ")

        if query.lower() == "exit":
            break

        response = qa.invoke(query)

        print("\n📌 Answer:")
        print(response.content)

        print("\n" + "=" * 50)