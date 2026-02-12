from langchain_neo4j import GraphCypherQAChain
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.tools import tool
from app.db.DGaph import get_db_connection

graph = get_db_connection()
llm2 = ChatGroq(model_name="llama-3.3-70b-versatile", 
                max_tokens=420,
                temperature=0.2)

CYPHER_GENERATION_TEMPLATE = """
Task: Generate a Cypher statement to find dependencies.
The graph has nodes labeled 'File' with properties 'path' and 'repo_url'.
The relationships are [:DEPENDS_ON].

Current Repo URL Context: {repo_url}

Instructions:
1. ALWAYS filter by `repo_url = '{repo_url}'` in the WHERE clause.
2. Do not use Markdown. Output only the raw Cypher query.
3. Use case-insensitive matching (toLower(f.path) CONTAINS ...).

CRITICAL OUTPUT FORMAT:
- If the question asks "What depends on X?", you must return:
  `target.path as target_file, collect(source.path) as affected_files`
  (Where `source` depends on `target`).

- If the question asks "What does X import?", you must return:
  `source.path as target_file, collect(target.path) as affected_files`
  (Where `source` is the file X, and `target` are the files it affects/uses).

Question: {question}
"""

cypher_prompt = PromptTemplate(
    template=CYPHER_GENERATION_TEMPLATE,
    input_variables=["question", "repo_url"]
)

chain = GraphCypherQAChain.from_llm(
    llm=llm2,
    graph=graph,
    verbose=True,
    allow_dangerous_requests=True,
    cypher_prompt=cypher_prompt,
    return_direct=True 
)

@tool
def dependency_graph(question: str, repo_url: str) -> dict:
    """Query the Neo4j dependency graph to answer questions about file structure and dependencies.
    
    Args:
        question: The user's question about dependencies or file structure
        repo_url: The repository URL to query
        
    Returns:
        A dict containing target_files and affected_files lists
    """
    try:
        raw_result = chain.invoke({
            "query": question, 
            "repo_url": repo_url
        })["result"]
        target_files = set()
        affected_files = set()
        
        for row in raw_result:
            t_val = row.get('target_file')
            if isinstance(t_val, list):
                target_files.update(t_val)
            elif t_val:
                target_files.add(t_val)
            a_val = row.get('affected_files')
            if isinstance(a_val, list):
                affected_files.update(a_val)
            elif a_val:
                affected_files.add(a_val)

        return {
            "target_files": list(target_files),
            "affected_files": list(affected_files)
        }

    except Exception as e:
        return {"error": f"Graph query failed: {e}", "target_files": [], "affected_files": []}

tools = [dependency_graph]