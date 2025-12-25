from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.postgres import get_db
from app.utils.users import get_user_by_id
router = APIRouter()

@router.get("/user/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    return await get_user_by_id(user_id, db)

