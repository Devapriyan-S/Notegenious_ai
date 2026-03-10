# Architecture

## Directory Structure
```
Notegenious_ai/
├── .github/
│   └── workflows/              # CI/CD (stays at root — GitHub requirement)
├── .dockerignore               # Docker ignore (stays at root — build context requirement)
├── .gitignore
├── LICENSE
├── backend/                    # Python FastAPI backend (unchanged)
│   ├── main.py
│   ├── auth.py
│   ├── notes.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
├── database/                   # All SQL files
│   ├── BACKEND_SETUP.sql
│   ├── SUPABASE_SETUP.sql
│   ├── NOTE_SHARES_MIGRATION.sql
│   └── FLOWCHART.md            # Mermaid ERD diagram
├── docker/                     # All Docker files
│   ├── Dockerfile              # Multi-stage build (COPY paths use frontend/ and docker/)
│   └── nginx.conf
├── docs/                       # All documentation
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   ├── GUIDE.md
│   ├── features.md
│   ├── cliff.toml
│   └── *.docx
└── frontend/                   # Next.js app
    ├── src/
    │   └── app/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── globals.css
    │       └── components/
    │           ├── Sidebar.tsx
    │           ├── Editor.tsx
    │           ├── AIPanel.tsx
    │           ├── ShareModal.tsx
    │           └── ThemeToggle.tsx
    ├── tests/
    ├── next.config.js
    ├── vitest.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── .eslintrc.json
    └── .prettierrc
```

## Component Architecture
- `page.tsx` holds all state (notes, sharedNotes, selectedId, selectedSharedId, apiUser, apiKey, theme, shareModal state)
- Props passed down to Sidebar, Editor, AIPanel
- Groq API called directly via fetch() from AIPanel
- Auth handled by Python backend JWT (token stored in localStorage as `ng_token`)
- Notes persisted via Python backend API with 2-second debounced auto-save + Ctrl+S immediate save
- API key stored in localStorage (`groq_api_key`)

## Python Backend Architecture
- FastAPI app running on port 9000
- PostgreSQL via psycopg2 (direct connection to Supabase)
- Own JWT auth (HS256) independent of Supabase auth
- Tables: `backend_users`, `backend_notes`, `note_shares` in Supabase PostgreSQL
- Start: `cd backend && uvicorn main:app --reload --port 9000`

## Auth Flow (Python backend)
1. User submits email/password in AuthModal
2. `apiLogin` calls `/api/auth/login` → backend returns JWT + user → token stored in `ng_token`
3. `apiSignup` calls `/api/auth/signup` → backend sends OTP to email → frontend shows OTP screen
4. User enters OTP → `apiVerifyOtp` calls `/api/auth/verify-otp` → backend creates user + returns JWT
5. All subsequent requests include `Authorization: Bearer <token>`
6. On page load, `apiGetMe()` checks token validity and loads user
7. Logout clears `ng_token` and sets `apiUser` to null → AuthModal shown as full-screen wall

## Share Note Flow
1. User clicks Share button in Editor toolbar (only shown for own notes, not shared-with-me notes)
2. ShareModal opens; user types an email address
3. Frontend debounces 500ms then calls `GET /api/auth/check-email?email=xxx`
4. If email NOT registered: shows amber notice + "Send Invite" button → calls `POST /api/notes/{id}/share` → backend calls `send_invite_email()` → returns `{ invited: true }`
5. If email IS registered: shows "Read only" / "Read & Edit" radio options + "Share Note" button → calls `POST /api/notes/{id}/share` with permission → backend upserts into `note_shares` → returns `{ shared: true, permission }`
6. Success state shown; modal auto-closes after 2 seconds
7. Recipient sees note in "Shared with me" section in Sidebar after next login/refresh
8. For "readable" shares: Editor shows "Read only" badge; title/textarea are readOnly; no Save/Delete/Share buttons
9. For "editable" shares: Editor is fully editable; saves go to `PUT /api/notes/{id}/shared-content` (checks note_shares permission)

## note_shares Table
```sql
note_shares (
  id UUID PRIMARY KEY,
  note_id UUID REFERENCES backend_notes,
  owner_id UUID REFERENCES backend_users,
  shared_with_user_id UUID REFERENCES backend_users,
  permission VARCHAR(10) CHECK ('readable' | 'editable'),
  created_at TIMESTAMPTZ,
  UNIQUE (note_id, shared_with_user_id)   -- upsert on re-share
)
```

## AI Flow
1. User sets API key (stored in localStorage)
2. User clicks Quick Action / Rewrite / Translate / Chat
3. AIPanel calls Groq API directly
4. Result displayed in AI Result Box
5. Apply button replaces or appends to note content

Note: Smart Tools and Power Analysis sections were removed from AIPanel. Remaining sections: Quick Actions, Rewrite As, Translate To, AI Result Box, Chat with Note.

## Editor.tsx Features
- Save .txt download
- Share button (only for own notes; hidden on shared-with-me notes and read-only views)
- Read-only mode: title input + textarea have readOnly; "Read only" badge shown; Delete/Share buttons hidden
- AI Inline Autocomplete: ghost text overlay using mirrored div technique. 800ms debounce. Math via local eval → Groq fallback. Question detection → short answer. General text → next 5-8 words. Tab to accept, Escape to dismiss. Uses llama-3.1-8b-instant for speed. Clears on note switch. Disabled when readOnly.

## API Routes (backend)
### Auth (prefix: /api/auth)
- POST /signup, POST /verify-otp, POST /login, GET /me, PUT /profile, POST /logout
- GET /check-email?email=xxx → { exists: bool }

### Notes (prefix: /api/notes)
- GET /           — list own notes
- POST /          — create note
- GET /shared     — notes shared with current user (MUST be before /{note_id})
- GET /{id}       — get one note
- PUT /{id}       — update own note
- DELETE /{id}    — delete own note
- POST /{id}/share           — share note (invite or set permission)
- PUT /{id}/shared-content   — update a shared note (editable permission only)
- POST /{id}/lock, POST /{id}/unlock, DELETE /{id}/lock
