from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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

# CORS must be registered first — before any router — so that preflight OPTIONS
# requests are answered before FastAPI's own routing can reject them.
# allow_methods and allow_headers use explicit lists instead of ["*"] because
# some proxies (including Render's edge layer) do not propagate a bare wildcard
# correctly in the Access-Control-Allow-Methods / Access-Control-Allow-Headers
# response headers, causing preflight requests to be rejected with 403.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin",
                   "X-Requested-With", "X-HTTP-Method-Override"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=600,
)

# Safety-net middleware: FastAPI's CORSMiddleware does NOT add
# Access-Control-Allow-Origin headers when the handler raises an unhandled
# exception (i.e. returns 500). This middleware ensures CORS headers are
# present on every response so the browser can always read the error body.
# It must be added AFTER CORSMiddleware so it runs as the outermost layer.
@app.middleware("http")
async def add_cors_on_error(request: Request, call_next):
    try:
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With, X-HTTP-Method-Override"
        return response
    except Exception:
        from fastapi.responses import JSONResponse
        import traceback
        print(f"UNHANDLED EXCEPTION: {traceback.format_exc()}")
        response = JSONResponse(
            {"detail": "Internal server error"},
            status_code=500
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With, X-HTTP-Method-Override"
        return response


# Explicit catch-all OPTIONS handler so that CORS preflight requests for any
# path are always answered with 200 even if the CORS middleware is bypassed by
# the proxy. This is a safety net and does not interfere with normal requests.
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(status_code=200)

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
