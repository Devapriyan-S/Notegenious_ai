# NoteGenius AI — Project Documentation

**Version:** 1.0
**Date:** March 2026
**Status:** Production

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture & How It Works](#4-architecture--how-it-works)
5. [Environment Variables](#5-environment-variables)
6. [Deployment](#6-deployment)
7. [Development Setup](#7-development-setup)

---

## 1. Project Overview

NoteGenius AI is a modern, AI-powered note-taking web application designed for productivity and collaboration. It combines a clean, responsive interface with advanced AI capabilities, allowing users to write, organize, share, and interact with their notes using voice input, AI autocomplete, and a conversational AI assistant.

The application is built on a three-tier architecture:

- **Frontend** — Next.js 14 (TypeScript), deployed on Vercel
- **Backend** — FastAPI (Python), deployed on Render
- **Database** — PostgreSQL, managed via Supabase

---

## 2. Features

### 2.1 User Authentication

Users can register, log in, and log out securely. Registration requires email verification via a one-time password (OTP) sent to the user's email address. Authentication tokens are issued as JWTs (JSON Web Tokens) and stored client-side. Passwords are hashed server-side using bcrypt.

- Register with email and password
- OTP email verification on signup (6-digit code, expires in 10 minutes)
- Login with email and password
- Logout (client discards token; stateless JWT design)

### 2.2 Note Management

The core of the application. Users can create and manage an unlimited number of notes with a rich editing experience.

- Create, edit, and delete notes
- Pin important notes to the top of the list
- Auto-save every 2 seconds (no manual save required)
- Live word count and character count displayed while editing

### 2.3 Note Colors and Tags

Users can visually organize their notes using color coding and tags.

- Assign a color to any note for quick visual identification
- Add one or more tags to notes for categorical organization
- Filter and browse notes by tag

### 2.4 Note Locking

Individual notes can be password-protected to prevent unauthorized access.

- Set a password on any note
- Optionally add a password hint
- Locked notes require the correct password to open

### 2.5 Note Sharing

Notes can be shared with other users of the application or with people who have not yet registered.

- Share a note with any email address
- Set the permission level: **readable** (view only) or **editable** (can make changes)
- If the recipient is not yet registered, an invitation email is sent automatically
- If the recipient is already registered, a share notification email is sent

### 2.6 Email Notifications

The backend sends transactional emails for key events using MailerSend SMTP.

- **Invitation email** — Sent to unregistered users who are invited to share a note, with a link to sign up
- **Share notification email** — Sent to registered users when a note is shared with them, including the note title and permission level
- **OTP verification email** — Sent during signup with a 6-digit verification code

All emails are sent from the backend via MailerSend SMTP on port 2525.

### 2.7 AI Autocomplete

As the user types in a note, the AI suggests the next 5 to 8 words inline. This speeds up writing and reduces friction for long-form notes.

- Suggestions appear automatically while typing
- Press **Tab** to accept the suggestion
- Press **Escape** to dismiss the suggestion
- Powered by Groq API using the `llama-3.1-8b-instant` model

### 2.8 Speech-to-Text

Users can dictate notes using their microphone. The audio is transcribed by the Groq Whisper API and inserted directly into the note editor.

- Toggle recording with the microphone button in the editor toolbar
- Keyboard shortcut: **Ctrl + Shift + V**
- Audio beep feedback when recording starts and stops
- Accessibility-friendly design
- Powered by Groq Whisper API (`whisper-large-v3-turbo` model)

### 2.9 AI Panel / Chat

A side panel allows users to ask questions about the content of their current note and receive AI-generated answers. This is useful for summarizing, expanding on ideas, or querying specific information within a note.

- Opens as a side panel within the note editor
- Context-aware: the AI reads the current note content
- Conversational interface for multi-turn questions
- Powered by Groq API

### 2.10 Download Notes

Any note can be exported and saved locally as a plain text file.

- Download a note as a `.txt` file with a single click
- File is named after the note title

### 2.11 Dark / Light Theme

The application supports both dark and light visual themes, toggled by the user.

- Toggle between dark and light mode via the theme button in the navigation
- Preference is persisted across sessions

### 2.12 Shared Notes View

A dedicated section in the application displays notes that other users have shared with the current user.

- Separate view for notes shared by others
- Permission badges indicate whether the note is readable or editable
- Editable shared notes can be modified directly

### 2.13 Groq API Key Configuration

AI features are powered by a shared Groq API key configured at the application level via an environment variable. Individual users do not need to supply their own API key.

- Shared key set via `NEXT_PUBLIC_GROQ_API_KEY` on Vercel
- All AI features (autocomplete, speech-to-text, chat) use this key

---

## 3. Tech Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend | Next.js 14 | TypeScript, App Router |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Backend | FastAPI | Python, async REST API |
| Database | PostgreSQL | Hosted on Supabase (connection pooler) |
| AI — Text | Groq API | `llama-3.1-8b-instant` model |
| AI — Speech | Groq Whisper API | `whisper-large-v3-turbo` model |
| Email | MailerSend SMTP | Port 2525, transactional email |
| Auth | JWT + bcrypt | `python-jose`, `passlib` |
| Frontend Hosting | Vercel | Automatic deploys from Git |
| Backend Hosting | Render | Web service, automatic deploys from Git |

---

## 4. Architecture and How It Works

### High-Level Flow

```
User Browser (Vercel — Next.js)
        │
        │  REST API calls (HTTPS)
        ▼
Backend API (Render — FastAPI)
        │
        │  SQL queries
        ▼
Database (Supabase — PostgreSQL)
```

### AI Feature Flow

AI features (autocomplete, speech-to-text, chat) call the Groq API directly from the browser using the shared API key. This keeps AI latency low and avoids routing large audio/text payloads through the backend.

```
User Browser
     │
     │  Groq API calls (direct, HTTPS)
     ▼
Groq API (llama-3.1-8b-instant / whisper-large-v3-turbo)
```

### Email Flow

When an event triggers an email (share, invite, OTP), the backend constructs the email and sends it via MailerSend SMTP. The `FRONTEND_URL` environment variable is used to generate the correct link in the email body, pointing users to the live Vercel deployment.

```
Backend (Render)
     │
     │  SMTP (port 2525)
     ▼
MailerSend → User's Inbox
```

### Authentication Flow

1. User submits email and password on the signup form
2. Backend generates a 6-digit OTP, stores it in memory (10-minute expiry), and sends it via email
3. User enters the OTP on the verification screen
4. Backend creates the user record in PostgreSQL and returns a JWT
5. Frontend stores the JWT and sends it in the `Authorization: Bearer` header on all subsequent API requests
6. Backend validates the JWT on every protected endpoint

---

## 5. Environment Variables

All environment variables must be configured in the respective hosting platform dashboards before deployment.

### Vercel (Frontend)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Full URL of the backend API on Render | `https://your-app.onrender.com` |
| `NEXT_PUBLIC_GROQ_API_KEY` | Shared Groq API key for all AI features | `gsk_...` |

### Render (Backend)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection pooler URL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | A long, random string |
| `SMTP_HOST` | MailerSend SMTP hostname | `smtp.mailersend.net` |
| `SMTP_PORT` | MailerSend SMTP port | `2525` |
| `SMTP_USER` | MailerSend SMTP username | `MS_xxx@yourdomain.mlsender.net` |
| `SMTP_PASSWORD` | MailerSend SMTP password | `mssp.xxx...` |
| `SMTP_FROM` | Sender email address | `MS_xxx@yourdomain.mlsender.net` |
| `FRONTEND_URL` | Vercel deployment URL — used in email links | `https://your-app.vercel.app` |

**Important:** The `FRONTEND_URL` variable on Render must be set to the actual Vercel deployment URL (e.g. `https://your-actual-app.vercel.app`). If this variable is not set, email links will fall back to `http://localhost:3000`, which will not work for users clicking links from production emails.

---

## 6. Deployment

### Frontend — Vercel

1. Connect the GitHub repository to Vercel
2. Set the root directory to `frontend/`
3. Configure all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard
4. Vercel automatically builds and deploys on every push to the main branch

### Backend — Render

1. Connect the GitHub repository to Render as a Web Service
2. Set the root directory to `backend/`
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Configure all environment variables in the Render dashboard
6. Render automatically deploys on every push to the main branch

### Database — Supabase

1. Create a PostgreSQL project on Supabase
2. Run the schema SQL from `SUPABASE_SETUP.sql` in the Supabase SQL editor
3. Copy the connection pooler URL from Supabase and set it as `DATABASE_URL` on Render

---

## 7. Development Setup

### Prerequisites

- Node.js 18 or later
- Python 3.11 or later
- A Supabase project with the schema applied
- A Groq API key
- A MailerSend account with SMTP credentials

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # then fill in values
uvicorn main:app --reload
```

The backend API will be available at `http://localhost:8000`.

### Running Tests

```bash
cd frontend
npm run test
```

---

*This document was generated for internal project reference. For deployment questions or feature requests, refer to the project repository.*
