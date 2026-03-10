# NoteGenius AI — Python Backend

FastAPI backend for NoteGenius AI.

## Setup

### 1. Install Python dependencies
```
cd backend
pip install -r requirements.txt
```

### 2. Run the SQL in Supabase
Go to Supabase → SQL Editor → run BACKEND_SETUP.sql

### 3. Start the backend
```
cd backend
uvicorn main:app --reload --port 9000
```

### 4. API docs
Open http://localhost:9000/docs for interactive Swagger UI

## Endpoints
- POST /api/auth/signup — Register
- POST /api/auth/login  — Login
- GET  /api/auth/me     — Get current user
- PUT  /api/auth/profile — Update profile
- GET  /api/notes       — List notes
- POST /api/notes       — Create note
- PUT  /api/notes/{id}  — Update note
- DELETE /api/notes/{id} — Delete note
- POST /api/notes/{id}/lock    — Lock note
- POST /api/notes/{id}/unlock  — Verify password & unlock
- DELETE /api/notes/{id}/lock  — Remove lock permanently
