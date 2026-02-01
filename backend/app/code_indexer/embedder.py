from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from qdrant_client.http import models
from qdrant_client.models import PointStruct
import uuid
from dotenv import load_dotenv
load_dotenv()

client = QdrantClient(url="http://localhost:6333")
COLLECTION_NAME = "code_companion"
if not client.collection_exists(collection_name=COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )
    print(f"Collection '{COLLECTION_NAME}' created!")

embedder=FastEmbedEmbeddings(model_name="BAAI/bge-base-en-v1.5")

vector_store=QdrantVectorStore(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding=embedder
)

def create_embeddings(chunks, userid: str, repo_url: str):
    embeddings = []
    
    for chunk in chunks:
        chunk.metadata["user_id"] = userid
        chunk.metadata["repo_url"] = repo_url
    
    batch_size = 64
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        texts = [chunk.page_content for chunk in batch_chunks]
        vectors = embedder.embed_documents(texts)
        embeddings.extend(zip(batch_chunks, vectors))
        print(f"Processed {min(i + batch_size, len(chunks))}/{len(chunks)} chunks")
    
    return embeddings


def store_embeddings(chunks, userid: str, repo_url: str):
    embeddings = create_embeddings(chunks, userid, repo_url)
    all_chunks, all_vectors = zip(*embeddings) if embeddings else ([], [])
    
    if all_chunks:
        upsert_batch_size = 500
        total_points = len(all_chunks)
        
        for i in range(0, total_points, upsert_batch_size):
            batch_chunks = all_chunks[i:i + upsert_batch_size]
            batch_vectors = all_vectors[i:i + upsert_batch_size]
            
            points = [
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector.tolist() if hasattr(vector, 'tolist') else list(vector),
                    payload={
                        "page_content": chunk.page_content,
                        **chunk.metadata
                    }
                )
                for chunk, vector in zip(batch_chunks, batch_vectors)
            ]
            
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )
            print(f"Stored {min(i + upsert_batch_size, total_points)}/{total_points} embeddings in Qdrant")
        
        return True
    return False

def retriver_content (userid:str,query:str,k:int=5):

    security_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="metadata.user_id",  
                match=models.MatchValue(value=userid)
            )
        ]
    )
    results=vector_store.similarity_search(
        query,
        k=k,
        filter=security_filter
    )
    return results