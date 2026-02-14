from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from sse_starlette.sse import EventSourceResponse
from sse_manager import sse_manager
from task_manager import task_manager
from app.utils.chatUtils import (
    create_new_chat,
    get_user_chats,
    send_message as send_message_util,
    get_chat_messages,
    clear_chat as clear_chat_util,
    delete_chat
)

router = APIRouter()
@router.get("/chat/stream/")
async def chat_stream(request: Request, chat_id: str):

    queue = sse_manager.get_queue(chat_id)

    async def event_generator():
        while True:
            if await request.is_disconnected():
                task_manager.cancel(chat_id)
                sse_manager.remove(chat_id)
                break

            token = await queue.get()

            if token == "[DONE]":
                yield {"data": "[DONE]"}
            else:
                yield {"data": token}

    return EventSourceResponse(event_generator())
@router.post("/chat/create")
async def create_chat(user_id: str, project_id: str, db: Session = Depends(get_db)):
    return await create_new_chat(user_id, project_id, db)

@router.get("/chat/list")
async def list_chats(user_id: str, project_id: str, db: Session = Depends(get_db)):
    return await get_user_chats(user_id, project_id, db)

@router.post("/chat/send-message")
async def send_message(chat_id: str, user_id: str, content: str, db: Session = Depends(get_db)):
    return await send_message_util(chat_id, user_id, content, db)

@router.get("/chat/messages")
async def get_messages(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    return await get_chat_messages(chat_id, user_id, db)

@router.post("/chat/clear")
async def clear_chat(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    return await clear_chat_util(chat_id, user_id, db)

@router.delete("/chat/delete")
async def delete_chat(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    return await delete_chat(chat_id, user_id, db)
