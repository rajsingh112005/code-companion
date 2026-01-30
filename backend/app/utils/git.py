import os
from fastapi.responses import RedirectResponse
from fastapi import HTTPException
import httpx
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from app.db.postgres import get_db
from app.db.models import User, OAuthToken
from app.utils.crypto import encrypt_token , decrypt_token
from dotenv import load_dotenv
load_dotenv()
Client_id= os.getenv("GITHUB_CLIENT_ID")
redirect_uri= os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")

def login_github():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={Client_id}&redirect_uri={redirect_uri}&scope=repo"
    )

async def callback_github(code: str, db: Session):
    params={
        "code":code,
        "redirect_uri":redirect_uri,
        "client_id":Client_id,
        "client_secret":os.getenv("CLIENT_SECRET"),
    }

    headers={"Accept":"application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response= await client.post(
            "https://github.com/login/oauth/access_token",
            data=params,
            headers=headers
        )
        
        response_data=response.json()
        access_token=response_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to retrieve access token")
    
    data = await process_githubCallback(access_token, db)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
    return RedirectResponse(url=f"{frontend_url}/auth/callback?success=true&user_id={data['user_id']}&name={data['name']}")

async def process_githubCallback(access_token: str, db: Session):
    headers={"Authorization":f"Bearer {access_token}",
             "Accept": "application/vnd.github.v3+json",
            }
    async with httpx.AsyncClient(timeout=30.0) as client:
        user_response= await client.get(
            "https://api.github.com/user",
            headers=headers
        )
        user_data=user_response.json()
        github_id=str(user_data.get("id"))
        email=user_data.get("email")
        name=user_data.get("name")
        avatar_url=user_data.get("avatar_url")

        
    user = db.query(User).filter(User.github_id == github_id).first()

    if not user:
        user = User(
            github_id=github_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    encrypted_token = encrypt_token(access_token)

    token = (
        db.query(OAuthToken)
        .filter(
            OAuthToken.user_id == user.id,
            OAuthToken.provider == "github",
        )
        .first()
    )

    if token:
        token.access_token_encrypted = encrypted_token
    else:
        token = OAuthToken(
            user_id=user.id,
            provider="github",
            access_token_encrypted=encrypted_token,
        )
        db.add(token)

    db.commit()
    return {
        'user_id':str(user.id),
        'name':name
    }

async def get_user_repositories(user_id: str, db: Session):
    token = (
        db.query(OAuthToken)
        .filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == "github",
        )
        .first()
    )
    
    if not token:
        raise HTTPException(status_code=404, detail="GitHub token not found for user")

    from app.utils.crypto import decrypt_token
    access_token = decrypt_token(token.access_token_encrypted)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers=headers,
            params={"per_page": 100, "sort": "updated"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories")
        
        repos = response.json()
        return {
            "repositories": repos,
            "count": len(repos)
        }
    
async def get_ascess_token(userid:str,db:Session=get_db()):

    token=(
        db.query(OAuthToken)
        .filter(
            OAuthToken.user_id == userid,
            OAuthToken.provider == "github",
        )
        .first()
    )

    return decrypt_token(token.access_token_encrypted)

