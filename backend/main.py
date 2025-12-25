from fastapi import FastAPI
from app.api.repo import router
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.db.postgres import engine
from app.db.base import Base
load_dotenv()
Base.metadata.create_all(bind=engine)

CORSMiddleware_settings = {
    "allow_origins": ["*"], 
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
app = FastAPI()
app.add_middleware(CORSMiddleware, **CORSMiddleware_settings)
app.include_router(router)
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)