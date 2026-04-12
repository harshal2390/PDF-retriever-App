from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from typing import List


class TextSplitter:
    """
    Handles splitting documents into chunks for better retrieval.
    """

    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into smaller chunks.
        """

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ".", " ", ""]
        )

        chunks = splitter.split_documents(documents)

        return chunks


# quick test
if __name__ == "__main__":
    from app.loaders.pdf_loader import MultiPDFLoader

    loader = MultiPDFLoader("data/pdfs")
    docs = loader.load()

    splitter = TextSplitter()
    chunks = splitter.split(docs)

    print(f"Original pages: {len(docs)}")
    print(f"Chunks created: {len(chunks)}")

    print(chunks[0].metadata)
    print(chunks[0].page_content[:200])