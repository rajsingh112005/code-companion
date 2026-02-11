from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.git import login_github, callback_github, get_user_repositories , get_ascess_token 
from app.utils.users import get_loaded_repo
from app.db.postgres import get_db
from app.code_indexer.loader import load_repo
from app.code_indexer.embedder import store_embeddings
from app.db.models import Project
import uuid

router=APIRouter()

@router.get("/login/github")
def github_login():
    return login_github()

@router.get("/auth/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    return await callback_github(code, db)

@router.get("/get_repo")
async def get_repo(user_id: str, db: Session = Depends(get_db)):
    return await get_user_repositories(user_id, db)  

@router.get("/loaded_repo")
async def loaded_repo(user_id: str, db: Session = Depends(get_db)):
    repos = await get_loaded_repo(user_id, db)
    return {
        "repositories": repos,
        "count": len(repos)
    }

@router.post("/load-repo")
async def repo_load(user_id:str,repo_url:str,db: Session = Depends(get_db)):
    existing_project = db.query(Project).filter(
        Project.owner_id == uuid.UUID(user_id),
        Project.repo_url == repo_url
    ).first()
    
    if existing_project and existing_project.status == "created":
        return {"message": "Project already loaded", "status": "already_loaded"}
    if existing_project and existing_project.status == "failed":
        db.delete(existing_project)
        db.commit()
    try:
        ascess_token = await get_ascess_token(user_id, db)
        chunks = await load_repo(repo_url, ascess_token)
        # Generate project_id for new project before storing embeddings
        project_id = str(uuid.uuid4()) if not existing_project else str(existing_project.id)
        is_stored = store_embeddings(chunks, project_id, user_id, repo_url)
        if len(chunks) == 0:
            is_stored = False
        if is_stored:
            repo_name = repo_url.rstrip('/').split('/')[-1]
            project = Project(
                owner_id=uuid.UUID(user_id),
                name=repo_name,
                repo_url=repo_url,
                status="created"
            )
            db.add(project)
            db.commit()
            
            return {"message": f"Repository loaded successfully", "status": "created"}
        else:
            repo_name = repo_url.rstrip('/').split('/')[-1]
            project = Project(
                owner_id=uuid.UUID(user_id),
                name=repo_name,
                repo_url=repo_url,
                status="failed"
            )
            db.add(project)
            db.commit()
            
            return {"message": f"Repository failed to load", "status": "failed"}
    except Exception as e:
        repo_name = repo_url.rstrip('/').split('/')[-1]
        project = Project(
            owner_id=uuid.UUID(user_id),
            name=repo_name,
            repo_url=repo_url,
            status="failed"
        )
        db.add(project)
        db.commit()
        return {"message": f"Error loading repository: {str(e)}", "status": "failed"}
    