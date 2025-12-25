from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

database_uri = os.getenv("DATABASE_URL")

if not database_uri:
    print("Warning: DATABASE_URL not found in environment variables")
    print("Using default SQLite database for development")
    database_uri = "sqlite:///./code_companion.db"

engine=create_engine(
    database_uri,
    pool_size=5,
    max_overflow=10,
)

SessionLocal=sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()