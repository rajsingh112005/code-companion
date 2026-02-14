# Code Companion 

Code Companion is an AI-powered codebase intelligence platform that lets you authenticate with GitHub, index repositories, analyze dependencies, and chat over your code using Retrieval-Augmented Generation (RAG).

The backend handles repository ingestion, embeddings, dependency analysis, and streaming chat responses. The frontend provides a Vite + React UI for repository selection and interactive chat.

## Key Capabilities
- GitHub OAuth authentication and repository listing.
- Repository indexing with semantic chunking and vector embeddings.
- Code-aware chat using RAG with streaming responses (SSE).
- Dependency graph queries backed by Neo4j.
- Persistent projects, chats, and messages using SQLAlchemy.

## Architecture Overview
- Backend: FastAPI + LangGraph (OAuth, repo ingestion, embeddings, RAG workflow, SSE streaming).
- Frontend: Vite + React (repo selection, chat UI, SSE-based streaming display).
- Vector store: Qdrant.
- Graph store: Neo4j.
- Database: PostgreSQL (recommended) or SQLite fallback.

## Project Structure
```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── code_indexer/
│   │   ├── db/
│   │   ├── rag/
│   │   └── utils/
│   ├── llm.py
│   ├── main.py
│   ├── requirements.txt
│   ├── sse_manager.py
│   └── task_manager.py
├── code-companion-04/
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Prerequisites
### Local Development
- Python 3.10+
- Node.js 18+
- Git
- Neo4j (cloud or local)

### Optional / Environment-Dependent
- PostgreSQL (recommended for production)
- Qdrant server

## Environment Variables
Create a `.env` file inside `backend/` (do not commit it).

### GitHub OAuth
```
GITHUB_CLIENT_ID=...
CLIENT_SECRET=...
REDIRECT_URI=http://localhost:8000/auth/callback
FRONTEND_URL=http://localhost:5173
```

### Database
```
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/dbname
```

If `DATABASE_URL` is not set, SQLite is used:

```
sqlite:///./code_companion.db
```

### Vector Database
```
QDRANT_URL=http://localhost:6333
```

### Neo4j (Required)
```
NEO4J_URI=neo4j+s://<your-instance>.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
```

### LLM Provider
```
GROQ_API_KEY=...
```

### Token Encryption
Used to securely store OAuth access tokens.

```
ENCRYPTION_KEY=...
```

Generate a Fernet key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Frontend Configuration (Optional)
In `code-companion-04/.env`:

```
VITE_BACKEND_URL=http://localhost:8000
```

## Setup Instructions
### 1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### 2) Frontend
```bash
cd code-companion-04
npm install
npm run dev
```

Open: http://localhost:5173
