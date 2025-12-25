from langchain_community.document_loaders import GitLoader
import tempfile
import shutil
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter

async def load_repo(repo_url:str , access_token:str):
    clean_url = repo_url.replace("https://", "").replace("http://", "")
    auth_url = f"https://{access_token}@{clean_url}.git"
    print(auth_url)
    allowed_extensions = {".py", ".js", ".ts", ".tsx", ".java", ".go", ".md", ".txt"}
    def is_valid_file(file_path):
        return any(file_path.endswith(ext) for ext in allowed_extensions)
    
    temp_dir = tempfile.mkdtemp()
    print(f"Created temporary workspace at: {temp_dir}")
    
    try:
        loader=GitLoader(
            clone_url=auth_url,
            repo_path=temp_dir,
            branch=".",  # Empty string to use repo's default branch
            file_filter=is_valid_file
        )

        documents=loader.load()
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=100
        )
        chunks = splitter.split_documents(documents)
        if(len(chunks)!=0):print(f"chunking successful, number of chunks: {len(chunks)}")

        return chunks
    except Exception as e:
        print(f"An error occurred while loading and chunking: {e}")
        return []
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as cleanup_error:
            print(f"Warning: Could not fully clean up temp directory: {cleanup_error}")