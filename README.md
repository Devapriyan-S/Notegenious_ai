# NoteGenius AI

NoteGenius AI is a full-stack, AI-powered note-taking web application. It combines a rich editor, real-time cloud sync, AI writing tools, and secure user authentication into one place.

- **Frontend** — Next.js 14 (TypeScript), runs on port 3001
- **Backend** — FastAPI (Python), runs on port 9000
- **Database** — PostgreSQL, managed via Supabase

---

## Running Locally

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

Backend runs at: `http://localhost:9000`

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3001`

> Make sure to set `NEXT_PUBLIC_API_URL=http://localhost:9000` in `frontend/.env.local`

---

## Environment Variables

### frontend/.env.local

```
NEXT_PUBLIC_API_URL=http://localhost:9000
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
```

### backend/.env

```
DATABASE_URL=your_supabase_pooler_url
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_gmail@gmail.com
FRONTEND_URL=http://localhost:3001
```

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind  |
| Backend  | FastAPI, Python, SQLAlchemy       |
| Database | PostgreSQL (Supabase)             |
| AI       | Groq API (user-supplied key)      |
| Auth     | JWT, bcrypt, OTP email verify     |

---

## Features

- Email + OTP registration and JWT authentication
- Create, edit, delete, pin, and auto-save notes
- Color coding and tag-based filtering
- Note locking with password protection
- AI autocomplete and AI assistant panel (requires Groq API key)
- Voice-to-text input
- Responsive design

---

## Deployment

- **Frontend** — Vercel
- **Backend** — Render
- **Database** — Supabase (PostgreSQL)

See `PREVIEW.md` for the full contributor technical reference including folder structure, API endpoints, and database schema.
