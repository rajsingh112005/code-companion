from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import ToolNode
from app.rag.tools import tools
load_dotenv()

llm=ChatGroq(
    model_name="llama-3.3-70b-versatile"
)
llm1=llm.bind_tools(tools)
llm_rag=llm 
tool_node = ToolNode(tools=tools)


