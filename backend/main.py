from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from auth import router as auth_router
from notes import router as notes_router

app = FastAPI(
    title="NoteGenius AI Backend",
    description="Python FastAPI backend for NoteGenius AI — note management with auth and locking",
    version="1.0.0"
)

# CORS — allow all origins so the Vercel frontend can reach the Render backend.
# For a public note-taking app this is safe. If you later want to restrict to
# specific domains, replace ["*"] with a list of your Vercel URLs and keep
# allow_credentials=False (credentials + wildcard is not permitted by browsers).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(notes_router)

@app.get("/")
def root():
    return {
        "name": "NoteGenius AI Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
