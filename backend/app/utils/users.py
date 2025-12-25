import os
from fastapi.responses import RedirectResponse
from fastapi import HTTPException
import httpx
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from app.db.postgres import get_db
from app.db.models import User, OAuthToken
from app.utils.crypto import encrypt_token
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

