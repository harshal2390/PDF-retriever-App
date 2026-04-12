from langchain_huggingface import HuggingFaceEmbeddings
from typing import Optional

class EmbeddingFactory:
    """
    Factory class to create embedding models.
    This makes it easy to swap models later (production mindset).
    """

    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize embedding model.
        
        :param model_name: HuggingFace model name
        """
        self.model_name = model_name or "sentence-transformers/all-MiniLM-L6-v2"

    def load_embeddings(self):
        """
        Load and return HuggingFace embedding model.
        """

        embeddings = HuggingFaceEmbeddings(
            model_name=self.model_name,
            model_kwargs={"device": "cpu"},  # use 'cuda' if GPU available
            encode_kwargs={
                "normalize_embeddings": True  # IMPORTANT for cosine similarity
            }
        )

        return embeddings
    
if __name__ == "__main__":
    factory = EmbeddingFactory()
    emb = factory.load_embeddings()

    vector = emb.embed_query("Hello world")
    print(dir(emb))
    print(len(vector))