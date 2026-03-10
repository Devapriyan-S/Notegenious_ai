# File Index

## Frontend Source Files (frontend/src/)
- `frontend/src/app/layout.tsx` — Root layout, html/body wrapper
- `frontend/src/app/page.tsx` — Main client component, all state management (uses Python backend API); exports Note, SharedNote, Theme types
- `frontend/src/app/globals.css` — Tailwind directives + custom CSS variables
- `frontend/src/app/components/Sidebar.tsx` — Left panel: notes list, search, API key, "Shared with me" section
- `frontend/src/app/components/Editor.tsx` — Center panel: title + content editor; supports readOnly prop for shared notes; Share button in toolbar
- `frontend/src/app/components/AIPanel.tsx` — Right panel: all AI features + chat
- `frontend/src/app/components/ThemeToggle.tsx` — Theme toggle button
- `frontend/src/app/components/AuthModal.tsx` — Auth modal (uses apiLogin/apiSignup from Python backend)
- `frontend/src/app/components/NoteLockModal.tsx` — Note lock/unlock modal
- `frontend/src/app/components/ShareModal.tsx` — Share note modal: email search, invite/permission flow, debounced check

## Frontend Library Files
- `frontend/src/lib/supabase.ts` — Supabase client (kept for reference; auth now handled by Python backend)
- `frontend/src/lib/notes.ts` — Supabase note helpers (kept for reference)
- `frontend/src/lib/api.ts` — Python backend API client (auth + notes CRUD + lock/unlock + share)

## Python Backend
- `backend/main.py` — FastAPI app entry point with CORS middleware
- `backend/auth.py` — Auth router: signup (OTP flow), verify-otp, login, /me, profile update, logout, check-email; send_otp_email + send_invite_email helpers
- `backend/notes.py` — Notes router: CRUD + lock/unlock/remove-lock + share + shared-content update + get-shared
- `backend/database.py` — psycopg2 connection context manager
- `backend/models.py` — Pydantic v2 models for auth, notes, and share; includes ShareNoteRequest, ShareNoteResponse, SharedNoteResponse, SharedNoteUpdate
- `backend/requirements.txt` — Python dependencies
- `backend/.env` — Environment variables (gitignored)
- `backend/README.md` — Backend setup and usage guide

## Database (database/)
- `database/SUPABASE_SETUP.sql` — Original Supabase tables
- `database/BACKEND_SETUP.sql` — Python backend tables (backend_users, backend_notes)
- `database/NOTE_SHARES_MIGRATION.sql` — note_shares table migration (run after BACKEND_SETUP.sql)
- `database/FLOWCHART.md` — Mermaid ERD diagram of all table relationships

## Test Files
- `frontend/tests/setup.ts` — Vitest setup, mocks for Web Speech API + clipboard
- `frontend/tests/utils.test.ts` — Tests for note utility functions
- `frontend/tests/noteManager.test.ts` — Tests for note CRUD operations

## Frontend Config Files
- `frontend/next.config.js` — Next.js static export config
- `frontend/vitest.config.ts` — Vitest test runner config
- `frontend/.eslintrc.json` — ESLint rules
- `frontend/.prettierrc` — Prettier formatting rules
- `frontend/package.json` — Node.js dependencies and scripts
- `frontend/tsconfig.json` — TypeScript config (paths: @/* -> src/*)
- `frontend/tailwind.config.ts` — Tailwind CSS config
- `frontend/postcss.config.mjs` — PostCSS config

## Docker (docker/)
- `docker/Dockerfile` — Multi-stage Docker build (uses frontend/ and docker/ paths)
- `docker/nginx.conf` — Nginx static file serving config
- `.dockerignore` — Docker ignore rules (stays at ROOT — Docker build context requirement)

## Docs (docs/)
- `docs/README.md` — Project overview and quick start
- `docs/GUIDE.md` — Detailed usage guide
- `docs/CHANGELOG.md` — Version changelog
- `docs/CONTRIBUTING.md` — Contribution guidelines
- `docs/features.md` — Feature list
- `docs/cliff.toml` — Git-cliff changelog config (referenced by release.yml)
- `docs/NoteGenius_AI_CICD_Pipeline.docx` — CI/CD pipeline documentation
- `docs/NoteGenius_AI_User_Guide.docx` — User guide document

## CI/CD (.github/workflows/ — stays at root)
- `.github/workflows/ci.yml` — Lint + test + build (working-directory: frontend)
- `.github/workflows/deploy.yml` — Deploy to GitHub Pages (path: frontend/out)
- `.github/workflows/docker.yml` — Build and push Docker image (file: docker/Dockerfile)
- `.github/workflows/release.yml` — Create release (config: docs/cliff.toml)
- `.github/workflows/pr-check.yml` — PR quality checks (working-directory: frontend)

## How to Run Each Part

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev        # development server on port 3000
npm run build      # static export to frontend/out/
npm run test       # run tests
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

### Docker
```bash
# Build from repo root (build context must be root so Dockerfile can access frontend/ and docker/)
docker build -f docker/Dockerfile -t notegenius-ai .
```
