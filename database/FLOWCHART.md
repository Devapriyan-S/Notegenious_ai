# Database Schema — NoteGenius AI

This document describes how the database tables connect together.

## Run Order

1. `SUPABASE_SETUP.sql` — Supabase-native tables (profiles, notes using Supabase Auth)
2. `BACKEND_SETUP.sql` — Python backend tables (backend_users, backend_notes)
3. `NOTE_SHARES_MIGRATION.sql` — Note sharing table (depends on backend_users and backend_notes)

---

## Entity Relationship Diagram

```mermaid
erDiagram
    backend_users {
        uuid id PK
        text email UK
        text password_hash
        text full_name
        text avatar_url
        text groq_api_key
        timestamptz created_at
        timestamptz updated_at
    }

    backend_notes {
        uuid id PK
        uuid user_id FK
        text title
        text content
        boolean is_locked
        text lock_password_hash
        text lock_hint
        boolean is_pinned
        text color
        text[] tags
        integer word_count
        timestamptz created_at
        timestamptz updated_at
    }

    note_shares {
        uuid id PK
        uuid note_id FK
        uuid owner_id FK
        uuid shared_with_user_id FK
        varchar permission
        timestamptz created_at
    }

    backend_users ||--o{ backend_notes : "owns (user_id)"
    backend_notes ||--o{ note_shares : "shared via (note_id)"
    backend_users ||--o{ note_shares : "shares as owner (owner_id)"
    backend_users ||--o{ note_shares : "receives share (shared_with_user_id)"
```

---

## Relationship Summary

| Relationship | From | To | Type | Description |
|---|---|---|---|---|
| owns | backend_users | backend_notes | one-to-many | A user owns zero or many notes |
| shared via | backend_notes | note_shares | one-to-many | A note can be shared with multiple users |
| shares as owner | backend_users | note_shares | one-to-many | A user can share many of their notes |
| receives share | backend_users | note_shares | one-to-many | A user can receive many shared notes |

---

## Constraints

- `backend_notes.user_id` — CASCADE DELETE: deleting a user removes all their notes
- `note_shares.note_id` — CASCADE DELETE: deleting a note removes all its share records
- `note_shares.owner_id` — CASCADE DELETE: deleting a user removes all shares they created
- `note_shares.shared_with_user_id` — CASCADE DELETE: deleting a user removes all shares they received
- `note_shares.(note_id, shared_with_user_id)` — UNIQUE: a note can only be shared once per recipient (re-sharing updates the permission via upsert)
- `note_shares.permission` — CHECK: must be `'readable'` or `'editable'`

---

## Data Flow

```mermaid
flowchart TD
    A[User signs up / logs in] --> B[backend_users record created]
    B --> C[User creates notes]
    C --> D[backend_notes records created\nwith user_id = owner]

    D --> E{Share note?}
    E -- Yes, target email registered --> F[note_shares record created\nor updated via upsert]
    E -- Yes, target email NOT registered --> G[Invite email sent\nno DB record created yet]
    E -- No --> H[Note stays private]

    F --> I{permission}
    I -- readable --> J[Recipient sees note read-only\nin Shared with me sidebar]
    I -- editable --> K[Recipient can edit note\nPUT /api/notes/:id/shared-content]
```
