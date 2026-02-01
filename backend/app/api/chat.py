from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.utils.chatUtils import (
    create_new_chat,
    get_user_chats,
    send_message,
    get_chat_messages,
    clear_chat,
    delete_chat
)

router = APIRouter()

@router.post("/chat/create")
async def create_chat_endpoint(user_id: str, project_id: str, db: Session = Depends(get_db)):
    """Create a new chat for a user and project"""
    return await create_new_chat(user_id, project_id, db)

@router.get("/chat/list")
async def list_chats_endpoint(user_id: str, project_id: str, db: Session = Depends(get_db)):
    """Get all chats for a user in a specific project"""
    return await get_user_chats(user_id, project_id, db)

@router.post("/chat/send-message")
async def send_message_endpoint(chat_id: str, user_id: str, content: str, db: Session = Depends(get_db)):
    """Send a message in a chat"""
    return await send_message(chat_id, user_id, content, db)

@router.get("/chat/messages")
async def get_messages_endpoint(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    """Get all messages in a chat"""
    return await get_chat_messages(chat_id, user_id, db)

@router.post("/chat/clear")
async def clear_chat_endpoint(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    """Clear all messages from a chat (but keep the chat)"""
    return await clear_chat(chat_id, user_id, db)

@router.delete("/chat/delete")
async def delete_chat_endpoint(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    """Delete a chat and all its messages"""
    return await delete_chat(chat_id, user_id, db)
