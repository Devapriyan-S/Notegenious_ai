from fastapi import APIRouter, HTTPException, Depends
from typing import List
import uuid

from database import get_db
from models import NoteCreate, NoteUpdate, NoteLockRequest, NoteUnlockRequest, NoteResponse, ShareNoteRequest, ShareNoteResponse, SharedNoteResponse, SharedNoteUpdate
from auth import get_current_user_id, send_invite_email

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


# NOTE: /shared MUST come before /{note_id} — FastAPI matches routes top-to-bottom
# and "shared" would be treated as a note_id otherwise.
@router.get("/shared", response_model=List[SharedNoteResponse])
def get_shared_notes(user_id: str = Depends(get_current_user_id)):
    """Return all notes shared with the current user."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT ns.id AS share_id, ns.note_id, ns.owner_id, ns.permission,
                      n.title, n.content, n.is_locked, n.lock_hint, n.is_pinned,
                      n.color, n.tags, n.word_count, n.created_at, n.updated_at
               FROM note_shares ns
               JOIN backend_notes n ON n.id = ns.note_id
               WHERE ns.shared_with_user_id = %s
               ORDER BY n.updated_at DESC""",
            (user_id,)
        )
        rows = cur.fetchall()
    return [
        SharedNoteResponse(
            share_id=str(r["share_id"]),
            note_id=str(r["note_id"]),
            owner_id=str(r["owner_id"]),
            permission=r["permission"],
            title=r["title"],
            content=r["content"],
            is_locked=r["is_locked"],
            lock_hint=r.get("lock_hint"),
            is_pinned=r["is_pinned"],
            color=r["color"] or "default",
            tags=r["tags"] or [],
            word_count=r["word_count"] or 0,
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


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


@router.post("/{note_id}/share", response_model=ShareNoteResponse)
def share_note(note_id: str, body: ShareNoteRequest, user_id: str = Depends(get_current_user_id)):
    # Verify caller owns this note
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM backend_notes WHERE id = %s AND user_id = %s", (note_id, user_id))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Note not found")
        # Check if target email is registered
        cur.execute("SELECT id FROM backend_users WHERE email = %s", (body.email,))
        target_user = cur.fetchone()

    if not target_user:
        # User not registered — send invitation email
        try:
            send_invite_email(body.email)
        except Exception as e:
            print(f"[INVITE] Failed to send invite to {body.email}: {e}")
        return ShareNoteResponse(invited=True)

    # User exists — validate permission
    if body.permission not in ("readable", "editable"):
        raise HTTPException(status_code=400, detail="Permission must be 'readable' or 'editable'")

    target_user_id = str(target_user["id"])
    if target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot share a note with yourself")

    share_id = str(uuid.uuid4())
    with get_db() as conn:
        cur = conn.cursor()
        # Upsert: if share already exists update permission
        cur.execute(
            """INSERT INTO note_shares (id, note_id, owner_id, shared_with_user_id, permission)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (note_id, shared_with_user_id)
               DO UPDATE SET permission = EXCLUDED.permission
               RETURNING permission""",
            (share_id, note_id, user_id, target_user_id, body.permission)
        )
        row = cur.fetchone()

    return ShareNoteResponse(shared=True, permission=row["permission"])


@router.put("/{note_id}/shared-content", response_model=NoteResponse)
def update_shared_note(note_id: str, body: SharedNoteUpdate, user_id: str = Depends(get_current_user_id)):
    """Allow a user with editable permission to update a shared note."""
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT permission FROM note_shares WHERE note_id = %s AND shared_with_user_id = %s",
            (note_id, user_id)
        )
        share = cur.fetchone()
    if not share:
        raise HTTPException(status_code=403, detail="You do not have access to this note")
    if share["permission"] != "editable":
        raise HTTPException(status_code=403, detail="You have read-only access to this note")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "content" in updates:
        updates["word_count"] = len(updates["content"].split())
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [note_id]
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            f"UPDATE backend_notes SET {set_clause} WHERE id = %s RETURNING *",
            values
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    return row_to_note(row)


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
