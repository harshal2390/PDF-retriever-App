from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
import os
from dotenv import load_dotenv


class QAChain:
    def __init__(self, vectorstore):
        load_dotenv()

        self.vectorstore = vectorstore

        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.3-70b-versatile",
            temperature=0.1
        )

    def create_chain(self):

        prompt = ChatPromptTemplate.from_template("""
You are a strict AI assistant.

RULES:
1. Answer ONLY from the given context.
2. DO NOT use external knowledge.
3. If answer not found, say:
   "I don't know based on the provided documents."
4. Keep answer concise (3-5 lines).

Context:
{context}

Question:
{question}

Answer:
""")

        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

        # 🔥 FINAL CORRECT CHAIN
        chain = (
            {
                "docs": retriever,  # ✅ keep raw docs
                "question": RunnablePassthrough()
            }
            # 🔹 create context string
            | RunnablePassthrough.assign(
                context=lambda x: "\n\n".join(
                    doc.page_content for doc in x["docs"]
                )
            )
            # 🔹 generate answer
            | RunnablePassthrough.assign(
                answer=lambda x: self.llm.invoke(
                    prompt.invoke({
                        "context": x["context"],
                        "question": x["question"]
                    })
                )
            )
        )

        return chain