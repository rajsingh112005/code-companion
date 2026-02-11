import os 
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

load_dotenv()

graph = Neo4jGraph(
    url=os.getenv("NEO4J_URI"),
    username=os.getenv("NEO4J_USERNAME"),
    password=os.getenv("NEO4J_PASSWORD"),
    )

def get_db_connection():
    return graph

def ingest_file(file_path, repo_url):
    """Creates a single File node in the DB."""
    query = "MERGE (f:File {path: $path, repo_url: $repo_url}) SET f.scanned = true"
    graph.query(query, params={"path": file_path, "repo_url": repo_url})

def ingest_dependencies(source_path, target_paths, repo_url):
    """Links source file to target files in the DB."""
    if not target_paths:
        return

    query = """
    MATCH (source:File {path: $source, repo_url: $repo_url})
    UNWIND $targets as target_path
    MERGE (target:File {path: target_path, repo_url: $repo_url})
    MERGE (source)-[:DEPENDS_ON]->(target)
    """
    graph.query(query, params={"source": source_path, "targets": target_paths, "repo_url": repo_url})

