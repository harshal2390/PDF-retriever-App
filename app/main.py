import os
from dotenv import load_dotenv

from app.embeddings.hf_embeddings import EmbeddingFactory
from app.vectorstore.faiss_store import FAISSVectorStore
from app.chains.qa_chain import QAChain


class RAGApplication:
    """
    Main application class to run RAG pipeline.
    """

    def __init__(self):
        load_dotenv()

        print("🔄 Initializing RAG Application...")

        # 🔹 Load embeddings
        self.embeddings = EmbeddingFactory().load_embeddings()

        # 🔹 Load vector store
        self.vectorstore = FAISSVectorStore()
        self.vectorstore.load(self.embeddings)

        # 🔹 Create QA chain
        self.qa_chain = QAChain(self.vectorstore.db).create_chain()

        print("✅ RAG System Ready!\n")

    def ask(self, query: str):
        """
        Ask question to RAG system.
        """

        response = self.qa_chain.invoke(query)

        return response.content


# ===========================
# 🔥 CLI RUNNER
# ===========================
if __name__ == "__main__":

    app = RAGApplication()

    print("💬 Ask your questions (type 'exit' to quit)\n")

    while True:
        query = input("Ask: ")

        if query.lower() == "exit":
            print("👋 Exiting RAG system...")
            break

        try:
            answer = app.ask(query)

            print("\n📌 Answer:")
            print(answer)

        except Exception as e:
            print(f"\n❌ Error: {str(e)}")

        print("\n" + "=" * 50)