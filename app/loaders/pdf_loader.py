from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
import os
from typing import List


class MultiPDFLoader:
    """
    Loads multiple PDFs from a folder and enriches metadata.
    """

    def __init__(self, folder_path: str):
        self.folder_path = folder_path

    def load(self) -> List[Document]:
        """
        Load all PDFs and return list of Documents.
        """

        documents = []

        # iterate over all files in folder
        for file_name in os.listdir(self.folder_path):

            # process only PDF files
            if not file_name.endswith(".pdf"):
                continue

            file_path = os.path.join(self.folder_path, file_name)

            loader = PyPDFLoader(file_path)

            # load returns list of Document (one per page)
            pdf_docs = loader.load()

            # enrich metadata
            for doc in pdf_docs:
                doc.metadata["source"] = file_name
                doc.metadata["page"] = doc.metadata.get("page", 0)

            documents.extend(pdf_docs)

        return documents


# quick test
if __name__ == "__main__":
    loader = MultiPDFLoader("data/pdfs")
    docs = loader.load()

    print(f"Loaded {len(docs)} pages")

    # print sample
    print(docs[0].metadata)
    print(docs[0].page_content[:200])