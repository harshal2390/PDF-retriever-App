from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from typing import List
import os


class FAISSVectorStore:
    """
    Handles creation, saving, loading, and querying FAISS vector store.
    """

    def __init__(self, persist_path: str = "vectorstore_db"):
        self.persist_path = persist_path
        self.db = None

    def create(self, documents: List[Document], embeddings):
        """
        Create FAISS index from documents.
        """

        self.db = FAISS.from_documents(documents, embeddings)
        return self.db

    def save(self):
        """
        Save FAISS index locally.
        """

        if self.db is None:
            raise ValueError("Vector store is empty. Create it first.")

        self.db.save_local(self.persist_path)

    def load(self, embeddings):
        """
        Load FAISS index from disk.
        """

        if not os.path.exists(self.persist_path):
            raise ValueError("No saved vectorstore found.")

        self.db = FAISS.load_local(
            self.persist_path,
            embeddings,
            allow_dangerous_deserialization=True
        )

        return self.db

    def similarity_search(self, query: str, k: int = 3):
        """
        Retrieve top-k similar documents.
        """

        if self.db is None:
            raise ValueError("Vector store not initialized.")

        return self.db.similarity_search(query, k=k)


# quick test
if __name__ == "__main__":
    from app.loaders.pdf_loader import MultiPDFLoader
    from app.processing.text_splitter import TextSplitter
    from app.embeddings.hf_embeddings import EmbeddingFactory

    loader = MultiPDFLoader("data/pdfs")
    docs = loader.load()

    splitter = TextSplitter()
    chunks = splitter.split(docs)

    embedding_model = EmbeddingFactory().load_embeddings()

    store = FAISSVectorStore()

    # create + save
    store.create(chunks, embedding_model)
    store.save()

    # load again
    store.load(embedding_model)

    # test query
    results = store.similarity_search("What is Jenkins?")

    for r in results:
        print("\n---")
        print(r.metadata)
        print(r.page_content[:200])