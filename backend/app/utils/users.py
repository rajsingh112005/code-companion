import uuid
from sqlalchemy.orm import Session
from app.db.models import User, OAuthToken, Project
from dotenv import load_dotenv
load_dotenv()

async def get_user_by_id(user_id: str, db: Session):
    user=await db.query(User).filter(User.id == user_id).first()
    return {
        'id': str(user.id),
        'github_id': user.github_id,
        'email': user.email,
        'name': user.name,
        'avatar_url': user.avatar_url,
    }

async def get_loaded_repo(user_id: str, db: Session):
 
    projects = db.query(Project).filter(
        Project.owner_id == uuid.UUID(user_id),
        Project.status == "created"
    ).all()
    
    return [
        {
            "id": str(project.id),
            "name": project.name,
            "repo_url": project.repo_url,
            "status": "created",
            "created_at": project.created_at.isoformat() if project.created_at else None,
        }
        for project in projects
    ]

