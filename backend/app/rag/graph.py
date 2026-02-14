import asyncio
from datetime import datetime

import uuid
from sse_manager import sse_manager
from task_manager import task_manager
from langgraph.graph import StateGraph , END
from sqlalchemy.orm import Session
from app.db.models import Message
from app.rag.nodes import (
    ChatState,
    load_memory,
    intent_router,
    dependency_node,
    invalid_node,
    embed_query,
    retrieve_chunks,
    build_context,
    llm_answer,
    assistant_message,
)

graph=StateGraph(ChatState)

graph.add_node("load_memory", load_memory)
graph.add_node("intent_router", intent_router)
graph.add_node("dependency_node", dependency_node)
graph.add_node("invalid_node", invalid_node)
graph.add_node("embed_query", embed_query)
graph.add_node("retrieve_chunks", retrieve_chunks)
graph.add_node("build_context", build_context)
graph.add_node("llm_answer", llm_answer)
graph.add_node("assistant_message", assistant_message)

graph.set_entry_point("load_memory")
graph.add_edge("load_memory", "intent_router")
graph.add_conditional_edges("intent_router", 
    lambda state: state["intent"],
    {   
        "chat": "embed_query",
        "dependency": "dependency_node",
        "invalid": "invalid_node",
    })
graph.add_edge("embed_query", "retrieve_chunks")
graph.add_edge("retrieve_chunks", "build_context")
graph.add_edge("build_context", "llm_answer")
graph.add_edge("llm_answer", "assistant_message")
graph.add_edge("dependency_node", "embed_query")
graph.add_edge("invalid_node", "assistant_message")
graph.add_edge("assistant_message", END)

async def llm_workflow(chat_id: str, user_id: str, project_id: str, repo_url: str, question: str, db: Session):
    queue = sse_manager.get_queue(chat_id)
    try:
        await queue.put("[LOADING]")
        
        initial_state = {
            "chat_id": chat_id,
            "user_id": user_id,
            "project_id": project_id,
            "repo_url": repo_url,
            "question": question,
            "recent_messages": [],
            "intent": "",
            "query_embedding": None,
            "retrieved_chunks": [],
            "context": None,
            "target_file": None,
            "affected_files": [],
            "answer": None,
        }
        workflow = graph.compile()
        result = await workflow.ainvoke(initial_state)
        answer = result.get("answer", "")
        if answer:
            await queue.put(f"[ANSWER]{answer}")
        else:
            await queue.put("[ANSWER]No response generated")
        
        await queue.put("[DONE]")
    except Exception as e:
        print(f"Error in llm_workflow: {e}")
        await queue.put(f"[ANSWER]Error: {str(e)}")
        await queue.put("[DONE]")
    finally:
        task_manager.cancel(chat_id)