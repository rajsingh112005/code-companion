import asyncio
from sqlalchemy.orm import Session
from app.db.models import Chat, Message, Project
import uuid
from datetime import datetime
from app.rag.graph import llm_workflow
from task_manager import task_manager
async def create_new_chat(user_id: str, project_id: str, db: Session):
    """Create a new chat for a user and project"""
    try:
        project = db.query(Project).filter(
            Project.id == uuid.UUID(project_id),
            Project.owner_id == uuid.UUID(user_id)
        ).first()
        
        if not project:
            return {"error": "Project not found or unauthorized", "status": "error"}
        new_chat = Chat(
            id=uuid.uuid4(),
            project_id=uuid.UUID(project_id),
            user_id=uuid.UUID(user_id),
            created_at=datetime.utcnow()
        )
        
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        return {
            "status": "success",
            "chat_id": str(new_chat.id),
            "created_at": new_chat.created_at.isoformat()
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


async def get_user_chats(user_id: str, project_id: str, db: Session):
    """Get all chats for a user in a specific project"""
    try:
        chats = db.query(Chat).filter(
            Chat.user_id == uuid.UUID(user_id),
            Chat.project_id == uuid.UUID(project_id)
        ).order_by(Chat.created_at.desc()).all()
        
        return {
            "status": "success",
            "chats": [
                {
                    "id": str(chat.id),
                    "project_id": str(chat.project_id),
                    "created_at": chat.created_at.isoformat(),
                    "message_count": len(chat.messages)
                }
                for chat in chats
            ],
            "count": len(chats)
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


async def send_message(chat_id: str, user_id: str, content: str, db: Session):
    try:
        chat = db.query(Chat).filter(
            Chat.id == uuid.UUID(chat_id),
            Chat.user_id == uuid.UUID(user_id)
        ).first()
        
        if not chat:
            return {"error": "Chat not found or unauthorized", "status": "error"}

        project = db.query(Project).filter(
            Project.id == chat.project_id
        ).first()
        
        if not project:
            return {"error": "Project not found", "status": "error"}
        
        user_message = Message(
            id=uuid.uuid4(),
            chat_id=uuid.UUID(chat_id),
            role="user",
            content=content,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        db.commit()
        task = asyncio.create_task(llm_workflow(
            chat_id=chat_id, 
            user_id=user_id, 
            project_id=str(chat.project_id),
            repo_url=project.repo_url,
            question=content,
            db=db
        ))
        task_manager.set(chat_id, task)
        
        return {
            "status": "success",
            "message_id": str(user_message.id),
            "created_at": user_message.created_at.isoformat()
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}

async def get_chat_messages(chat_id: str, user_id: str, db: Session, limit: int | None = None):
    """Get all messages in a chat"""
    try:
        chat = db.query(Chat).filter(
            Chat.id == uuid.UUID(chat_id),
            Chat.user_id == uuid.UUID(user_id)
        ).first()
        
        if not chat:
            return {"error": "Chat not found or unauthorized", "status": "error"}
        
        query = db.query(Message).filter(
            Message.chat_id == uuid.UUID(chat_id)
        )

        if limit and limit > 0:
            messages = query.order_by(Message.created_at.desc()).limit(limit).all()
            messages.reverse()
        else:
            messages = query.order_by(Message.created_at.asc()).all()
        
        return {
            "status": "success",
            "messages": [
                {
                    "id": str(msg.id),
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ],
            "count": len(messages)
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


async def clear_chat(chat_id: str, user_id: str, db: Session):
    """Clear all messages from a chat (but keep the chat)"""
    try:
        chat = db.query(Chat).filter(
            Chat.id == uuid.UUID(chat_id),
            Chat.user_id == uuid.UUID(user_id)
        ).first()
        
        if not chat:
            return {"error": "Chat not found or unauthorized", "status": "error"}
        
        db.query(Message).filter(
            Message.chat_id == uuid.UUID(chat_id)
        ).delete()
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Chat cleared successfully"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}


async def delete_chat(chat_id: str, user_id: str, db: Session):
    """Delete a chat and all its messages"""
    try:
        chat = db.query(Chat).filter(
            Chat.id == uuid.UUID(chat_id),
            Chat.user_id == uuid.UUID(user_id)
        ).first()
        
        if not chat:
            return {"error": "Chat not found or unauthorized", "status": "error"}
        db.delete(chat)
        db.commit()
        
        return {
            "status": "success",
            "message": "Chat deleted successfully"
        }
    except Exception as e:
        return {"error": str(e), "status": "error"}
