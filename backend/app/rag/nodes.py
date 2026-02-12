from app.db.postgres import get_db
from app.db.models import Message
from datetime import datetime
import uuid
import asyncio
from typing import Dict, TypedDict, Literal, List
from langchain_core.messages import HumanMessage, SystemMessage
from llm import llm_rag, llm1
from pydantic import BaseModel,Field
from app.code_indexer.embedder import retriver_content , embedder
from app.rag.tools import dependency_graph
class ChatState(TypedDict):
    chat_id: str
    user_id: str
    project_id: str
    repo_url: str
    question: str
    recent_messages: list 
    intent: str  
    query_embedding: list | None
    retrieved_chunks: list
    context: str | None
    target_file: str | None
    affected_files: list | None
    answer: str | None

class IntentRouter(BaseModel):
    Node:Literal["chat", "dependency","invalid"]=Field(
        desdcription="The node for Strict intent classification."
    )
structured_llm=llm1.with_structured_output(IntentRouter)

async def load_memory(state: ChatState) -> dict:
    from app.utils.chatUtils import get_chat_messages
    
    k = 6
    db_gen = get_db()
    db = next(db_gen)
    try:
        result = await get_chat_messages(state['chat_id'], state['user_id'], db, limit=k)
    finally:
        db_gen.close()

    if result.get("status") != "success":
        return {"recent_messages": []}
    else:
        return {"recent_messages": result.get("messages", [])}

async def intent_router(state: ChatState) -> dict:
    system_prompt = """You are the Router Agent for a code analysis tool.
Your task is to classify the user's query into exactly one of these three categories:

### 1. 'dependency' (Structure & Graph)
Use this ONLY when the user asks about **connections** between files/modules.
- Triggers: "imports", "depends on", "parent/child", "graph", "architecture", "flow", "connected to", "impact of deleting".
- *Key distinction:* Asking *'Who uses file X?'* is Dependency.

### 2. 'chat' (Content, Logic & Retrieval) -> **THE DEFAULT**
Use this for everything else: coding, explaining, debugging, or **reading file content**.
- Triggers: "how does X work", "show me code", "content of file", "explain", "write test", "debug", "refactor".
- *Key distinction:* Asking *'What is IN file X?'* is Chat (Vector Search).

### 3. 'invalid'
For non-coding topics (cooking, weather, gibberish).

--- FEW-SHOT EXAMPLES (Follow these patterns) ---

User: "Which files import auth.py?"
Intent: dependency

User: "Show me the code inside auth.py."
Intent: chat

User: "Trace the architectural flow from API to Database."
Intent: dependency

User: "How does the login function work?"
Intent: chat

User: "Does user_controller depend on the database?"
Intent: dependency

User: "Write a unit test for the calculation module."
Intent: chat

User: "What is the capital of France?"
Intent: invalid

User: "Show me the dependency graph."
Intent: dependency

User: "What is in the utils folder?"
Intent: chat

User: "If I delete the User class, what breaks?"
Intent: dependency
"""
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=state['question'])
    ]
    decision = await structured_llm.ainvoke(messages)
    intent = decision.Node
    if intent not in ["dependency", "invalid", "chat"]:
        intent = "chat"  
    return {"intent": intent}
async def dependency_node(state: ChatState) -> dict:
    question = state['question']
    repo_url = state['repo_url']

    try:
        answer = dependency_graph.invoke({"question": question, "repo_url": repo_url})
        
        target_file = answer.get("target_files", []) if isinstance(answer, dict) else []
        target_file_str = target_file[0] if target_file else None
        
        return {
            "target_file": target_file_str,
            "affected_files": answer.get("affected_files", []) if isinstance(answer, dict) else []
        }
    except Exception as e:
        print(f"[ERROR] dependency_node failed: {e}")
        return {
            "target_file": None,
            "affected_files": []
        }
async def invalid_node(state: ChatState) -> dict:
    return {
        "answer": "I'm sorry, but I can only assist with questions related to code analysis and repository structure. Please ask a relevant question about the codebase."
    }

async def embed_query(state: ChatState) -> dict:
    embedding = embedder.embed_query(state['question'])
    return {
        "query_embedding": embedding
    }

async def retrieve_chunks(state: ChatState) -> dict:
    try:
        retrieved = retriver_content(state['project_id'], state['user_id'], state['question'], k=20)
        if not retrieved:
            print(f"[DEBUG] No chunks retrieved for project_id={state['project_id']}, user_id={state['user_id']}, question='{state['question']}'")
            return {"retrieved_chunks": []}
        
        print(f"[DEBUG] Retrieved {len(retrieved)} chunks for project_id={state['project_id']}, user_id={state['user_id']}")
        return {"retrieved_chunks": retrieved}
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chunks: {e}")
        return {"retrieved_chunks": []}


def build_context(state: ChatState) -> dict:
    MAX_CHARS = 12000
    MAX_CHUNKS_PER_FILE = 3

    retrieved_chunks = state.get("retrieved_chunks", [])
    if not retrieved_chunks:
        print("[DEBUG] No retrieved chunks")
        return {"context": ""}
    for chunk in retrieved_chunks:
        print(f"[DEBUG] Chunk metadata: {getattr(chunk, 'metadata', {})}, content preview: {chunk.page_content[:200] if hasattr(chunk, 'page_content') else chunk.get('content', '')[:200]}")
    grouped = {}

    for chunk in retrieved_chunks:
        if hasattr(chunk, "metadata"):
            file_path = chunk.metadata.get("file_path", "unknown")
            content = chunk.page_content
        else:
            file_path = chunk.get("file_path", "unknown")
            content = chunk.get("content", "")

        grouped.setdefault(file_path, [])
        if len(grouped[file_path]) < MAX_CHUNKS_PER_FILE:
            grouped[file_path].append(content)

    context_blocks = []
    total_chars = 0

    for file_path, contents in grouped.items():
        for content in contents:
            block = f"\n--- File: {file_path} ---\n{content.strip()}\n"
            if total_chars + len(block) > MAX_CHARS:
                break
            context_blocks.append(block)
            total_chars += len(block)

    final_context = (
        "The following code snippets are extracted from the repository.\n"
        "Use ONLY this code to answer the question.\n\n"
        + "\n".join(context_blocks)
    )

    print("[DEBUG] Built context length:", len(final_context))
    return {
        "context": final_context
    }


SYSTEM_PROMPT = """
You are a codebase assistant.

Rules:
- Answer ONLY using the provided code context.
- If the answer is not present in the context, say:
  "I don't have enough information in the provided code to answer this."
- Be concise and technical.
- Reference file names when relevant.
- Never make assumptions beyond the provided code.
- Use the dependency info only if it is available for your answer, but don't hallucinate new dependencies.
- The 'target_file' is the file directly related to the question.
- The 'affected_files' are files that are structurally connected to the target (e.g. dependencies or dependents).
"""

async def llm_answer(state: ChatState) -> dict:
    messages = []

    messages.append({
        "role": "system",
        "content": SYSTEM_PROMPT.strip()
    })

    for msg in state.get("recent_messages", []):
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    user_prompt = f"""
CODE CONTEXT:
{state.get("context", "")}
DEPENDENCY INFO:
- Target Files: {state.get("target_file", [])}
- Affected Files: {state.get("affected_files", [])}
QUESTION:
{state["question"]}
""".strip()

    messages.append({
        "role": "user",
        "content": user_prompt
    })
    
    try:
        print(f"[DEBUG] llm_answer: Calling LLM with {len(user_prompt)} char prompt")
        response = await asyncio.wait_for(llm_rag.ainvoke(messages), timeout=30.0)
        print(f"[DEBUG] llm_answer: Response object: {response}")
        answer = response.content if hasattr(response, 'content') else str(response)
        
        print(f"[DEBUG] llm_answer: Got response, length={len(answer)}")
        if not answer or answer.strip() == "":
            print(f"[WARNING] llm_answer: Empty response from LLM, using fallback")
            answer = "I received an empty response from the LLM. Please try rephrasing your question."
        return {
            "answer": answer
        }
    
    except Exception as e:
        print(f"[ERROR] llm_answer: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": f"Error generating response: {str(e)}"
        }

async def assistant_message(state: ChatState) -> dict:
    try:
        db_gen = get_db()
        db = next(db_gen)
        try:
            assistant_msg = Message(
                id=uuid.uuid4(),
                chat_id=uuid.UUID(state["chat_id"]),
                role="assistant",
                content=state.get("answer") or "",
                created_at=datetime.utcnow()
            )

            db.add(assistant_msg)
            db.commit()
            db.refresh(assistant_msg)
        finally:
            db_gen.close()

        return {}
    except Exception as e:
        print(f"Error saving assistant message: {e}")
        return {}