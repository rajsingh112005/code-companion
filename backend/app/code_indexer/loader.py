import tempfile
import shutil
import os
import asyncio
from langchain_core.documents import Document
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import RecursiveCharacterTextSplitter,Language 
from git import Repo
async def load_repo(repo_url:str , access_token:str):
    clean_url = repo_url.replace("https://", "").replace("http://", "")
    auth_url = f"https://{access_token}@{clean_url}.git"
    print(auth_url)
    allowed_suffixes = [".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go"]
    
    temp_dir = tempfile.mkdtemp()
    print(f"Created temporary workspace at: {temp_dir}")
    
    try:
        await asyncio.to_thread(Repo.clone_from, auth_url, temp_dir)
        print(f"Cloned repository {repo_url} into {temp_dir}")
        loader=GenericLoader.from_filesystem(
            temp_dir,
            glob="**/*",
            suffixes=allowed_suffixes,
            parser=LanguageParser(
                language=None,
                parser_threshold=20
            )
        )

        semantic_chunks=await asyncio.to_thread(loader.load)
        print(f"   Found {len(semantic_chunks)} semantic nodes.")

        chunks=contextAware_chunking(semantic_chunks)

        return chunks
    except Exception as e:
        print(f"An error occurred while loading and chunking: {e}")
        return []
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as cleanup_error:
            print(f"Warning: Could not fully clean up temp directory: {cleanup_error}")

def contextAware_chunking(semantic_chunks , chunk_size=1000, chunk_overlap=200):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    all_chunks = []
    for doc in semantic_chunks:
        if len(doc.page_content)<chunk_size:
            splits=[doc.page_content]
        else:
            splits = text_splitter.split_text(doc.page_content)
        first_line = doc.page_content.split('\n')[0][:100]
        file_name = doc.metadata.get("source", "unknown").split("/")[-1]
        header = f"File: {file_name} | Context: {first_line}\n"

        for split in splits:
            all_chunks.append(Document(
                page_content=header + split,
                metadata=doc.metadata
            ))
    return all_chunks