import tempfile
import shutil
import os
import asyncio
from langchain_core.documents import Document
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import RecursiveCharacterTextSplitter,Language 
from app.code_indexer.dependencies import process_repository
from git import Repo

EXTENSION_MAP = {
    ".py": Language.PYTHON,
    ".js": Language.JS,
    ".jsx": Language.JS,
    ".ts": Language.TS,
    ".tsx": Language.TS,
    ".java": Language.JAVA,
    ".go": Language.GO,
    ".cpp": Language.CPP,
    ".rs": Language.RUST,
    ".rb": Language.RUBY,
    ".php": Language.PHP,
    ".html": Language.HTML,
    ".md": Language.MARKDOWN,
}
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
        try:
            print("Building Dependency Graph...")
            await asyncio.to_thread(process_repository, temp_dir, repo_url)
            print("Graph built successfully.")
        except Exception as graph_error:
            print(f"GRAPH FAILURE (Skipping): {graph_error}")
        loader=GenericLoader.from_filesystem(
            temp_dir,
            glob="**/*",
            suffixes=allowed_suffixes,
            parser=LanguageParser(
                language=None,
                parser_threshold=0
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

def contextAware_chunking(semantic_chunks, chunk_size=1000, chunk_overlap=200):
    all_chunks = []
    default_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )

    for doc in semantic_chunks:
        source = doc.metadata.get("source", "")
        _, extension = os.path.splitext(source)
        lang_enum = EXTENSION_MAP.get(extension)
        
        if lang_enum:
            splitter = RecursiveCharacterTextSplitter.from_language(
                language=lang_enum,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
        else:
            splitter = default_splitter
        lines = doc.page_content.split('\n')
        definition = ""
        for line in lines[:5]:
            stripped = line.strip()
            if any(stripped.startswith(k) for k in ["def ", "class ", "function ", "async ", "pub ", "func "]):
                definition = line
                break
        if not definition:
            definition = lines[0] if lines else "Unknown Context"
        definition = definition[:150] 
        file_name = source.split("/")[-1]
        header = f"File: {file_name} | Definition: {definition}\n"
        if len(doc.page_content) < chunk_size:
            splits = [f"File: {file_name} | \n" + doc.page_content]
        else:
            raw_splits = splitter.split_text(doc.page_content)
            splits = []
            for i, split in enumerate(raw_splits):
                if i == 0:
                    splits.append(f"File: {file_name} | \n" + split)
                else:
                    splits.append(header + split)

        for split in splits:
            metadata = {
                **doc.metadata,
                "file_path": source,  
                "file_name": file_name,
            }
            all_chunks.append(Document(
                page_content=split,
                metadata=metadata
            ))
            
    return all_chunks