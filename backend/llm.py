from dotenv import load_dotenv
from langchain_groq import ChatGroq
load_dotenv()

llm1=ChatGroq(
    model_name="llama-3.3-70b-versatile"
)
print (llm1.predict("What is the capital of France?"))
