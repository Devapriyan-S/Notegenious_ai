from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid

from database import get_db
from models import NoteCreate, NoteUpdate, NoteLockRequest, NoteUnlockRequest, NoteResponse
from auth import get_current_user_id

router = APIRouter(prefix="/api/notes", tags=["notes"])


def row_to_note(row) -> NoteResponse:
    return NoteResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        title=row["title"],
        content=row["content"],
        is_locked=row["is_locked"],
        lock_hint=row.get("lock_hint"),
        is_pinned=row["is_pinned"],
        color=row["color"] or "default",
        tags=row["tags"] or [],
        word_count=row["word_count"] or 0,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.get("", response_model=List[NoteResponse])
def get_notes(user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT * FROM backend_notes WHERE user_id = %s
               ORDER BY is_pinned DESC, updated_at DESC""",
            (user_id,)
        )
        rows = cur.fetchall()
    return [row_to_note(r) for r in rows]


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(body: NoteCreate, user_id: str = Depends(get_current_user_id)):
    note_id = str(uuid.uuid4())
    word_count = len((body.content or "").split()) if body.content else 0
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO backend_notes (id, user_id, title, content, color, tags, word_count)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (note_id, user_id, body.title, body.content, body.color, body.tags, word_count)
        )
        row = cur.fetchone()
    return row_to_note(row)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM backend_notes WHERE id = %s AND user_id = %s", (note_id, user_id))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return row_to_note(row)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, body: NoteUpdate, user_id: str = Depends(get_current_user_id)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "content" in updates:
        updates["word_count"] = len(updates["content"].split())
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [note_id, user_id]
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE backend_notes SET {set_clause} WHERE id = %s AND user_id = %s RETURNING *",
            values
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return row_to_note(row)


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: str, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM backend_notes WHERE id = %s AND user_id = %s", (note_id, user_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note not found")


@router.post("/{note_id}/lock", response_model=NoteResponse)
def lock_note(note_id: str, body: NoteLockRequest, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """UPDATE backend_notes
               SET is_locked = true, lock_password_hash = %s, lock_hint = %s
               WHERE id = %s AND user_id = %s RETURNING *""",
            (body.password_hash, body.lock_hint, note_id, user_id)
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return row_to_note(row)


@router.post("/{note_id}/unlock", response_model=NoteResponse)
def unlock_note(note_id: str, body: NoteUnlockRequest, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM backend_notes WHERE id = %s AND user_id = %s",
            (note_id, user_id)
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    if not row["is_locked"]:
        return row_to_note(row)
    if row["lock_password_hash"] != body.password_hash:
        raise HTTPException(status_code=403, detail="Incorrect password")
    # Password matches — return the full note (frontend handles session unlock)
    return row_to_note(row)


@router.delete("/{note_id}/lock", response_model=NoteResponse)
def remove_lock(note_id: str, body: NoteUnlockRequest, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM backend_notes WHERE id = %s AND user_id = %s",
            (note_id, user_id)
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    if row["lock_password_hash"] != body.password_hash:
        raise HTTPException(status_code=403, detail="Incorrect password")
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """UPDATE backend_notes
               SET is_locked = false, lock_password_hash = null, lock_hint = null
               WHERE id = %s AND user_id = %s RETURNING *""",
            (note_id, user_id)
        )
        row = cur.fetchone()
    return row_to_note(row)
