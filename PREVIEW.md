# NoteGenius AI — Contributor Preview
@
This document is a complete technical reference for contributors. It covers everything about the project: what it is, how it works, the full folder structure, every component, every backend endpoint, the database schema, how to run it locally, and the CI/CD workflow. Read this before opening a pull request.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features List](#2-features-list)
3. [Tech Stack](#3-tech-stack)
4. [Libraries Used](#4-libraries-used)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Frontend Code Walkthrough](#6-frontend-code-walkthrough)
7. [Backend Code Walkthrough](#7-backend-code-walkthrough)
8. [Database Schema](#8-database-schema)
9. [How to Run Locally](#9-how-to-run-locally)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [CI/CD and Git Workflow](#11-cicd-and-git-workflow)

---

## 1. Project Overview

NoteGenius AI is a full-stack, AI-powered note-taking web application. It solves the problem of disconnected note-taking by combining a rich editor, real-time cloud sync, AI writing tools, and secure collaboration into one place.

### The Problem It Solves

Most note-taking apps are either too simple (no AI), too expensive (paid AI tiers), or require you to trust a third party with your data. NoteGenius AI lets users bring their own free Groq API key, keep their notes in their own PostgreSQL database, and get powerful AI features at zero ongoing cost.

### User Flow

```
Sign up
  |
  v
Email OTP verification (6-digit code sent via SMTP)
  |
  v
Account created, JWT issued, logged in
  |
  v
Notes loaded from PostgreSQL backend
  |
  v
Create / edit notes in the center editor
  |-- Auto-save triggers 2 seconds after last keystroke
  |-- Ctrl+S triggers an immediate save
  |
  v
AI features (right panel) -- requires free Groq API key
  |-- Quick actions: Summarize, Expand, Fix Grammar, Key Points, ELI5
  |-- Rewrite As: Professional, Casual, Academic, Persuasive, Creative
  |-- Translate To: Spanish, French, German, Japanese, Chinese, Arabic, Tamil
  |-- Chat with Note: open-ended Q&A about the current note
  |-- AI autocomplete: ghost text suggestions while typing (Tab to accept)
  |
  v
Share a note with another user by email
  |-- Choose: Read only  OR  Read & Edit
  |-- If email not registered: sends an invitation email
  |-- Shared notes appear in the "Shared with me" sidebar section
  |
  v
Lock a note with a password
  |-- Password hashed (SHA-256) on the frontend before sending to backend
  |-- Locked notes show a lock icon in the sidebar
  |-- Session unlock: unlocked for current browser session without removing the lock
  |-- Remove lock: permanently removes the password
  |
  v
Logout
  |-- JWT cleared from localStorage
  |-- State reset to local (unauthenticated) mode
```

---

## 2. Features List

| Feature | Description |
|---|---|
| Note creation | Creates a new note via the backend API with a UUID, defaults to "Untitled Note" |
| Note editing | Real-time title and content editing in the center editor panel |
| Note deletion | Deletes from backend; sidebar updates immediately (optimistic) |
| Auto-save (2s) | A 2-second debounced timeout fires an API PUT after the user stops typing |
| Ctrl+S save | A keydown listener immediately fires the API PUT, bypassing the debounce |
| AI: Summarize | Sends note content to Groq API, returns bullet-point summary (appended) |
| AI: Expand | Rewrites note into detailed paragraphs (appended) |
| AI: Fix Grammar | Corrects grammar and spelling using a fast model, replaces note content |
| AI: Key Points | Extracts numbered key points and action items (appended) |
| AI: ELI5 | Explains the note in simple terms (appended) |
| AI: Rewrite As | Rewrites note in five different tones (replaces content) |
| AI: Translate To | Translates note to seven languages (appended) |
| AI: Chat with Note | Persistent chat interface using note content as system context |
| AI: Autocomplete | Ghost text suggestions while typing; Tab to accept, Esc to dismiss |
| Note locking | Password-protected notes; SHA-256 hash stored in DB; hint stored alongside |
| Session unlock | Unlocks a note for the current session without removing the lock |
| Remove lock | Permanently removes the password by verifying the current password first |
| Note pinning | `is_pinned` boolean; pinned notes sorted first in the list |
| Note tagging | Text array of tags stored per note |
| Note coloring | Color string stored per note (default or named color) |
| Note sharing | Share with another user by email; choose readable or editable permission |
| Invitation email | If the target email is not registered, sends a join invitation via SMTP |
| Shared notes view | "Shared with me" section in the sidebar; shows permission badge (View/Edit) |
| Edit shared note | Users with editable permission can update title and content of shared notes |
| Email OTP verification | 6-digit OTP sent on signup; expires in 10 minutes; stored in-memory |
| Dark / light theme | Toggle in sidebar header; applies Tailwind class to `<html>` and `<body>` |
| Sidebar search | Filters notes list by title and content in real time |
| Download as .txt | Toolbar button exports note as a formatted plain-text file |
| Profile update | PUT /api/auth/profile to update full_name, groq_api_key, avatar_url |
| Responsive layout | Mobile toggle buttons show/hide sidebar and AI panel |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router, `'use client'` components) |
| UI library | React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Backend framework | FastAPI (Python) |
| Backend language | Python 3 |
| Database | PostgreSQL (hosted on Supabase) |
| DB driver | psycopg2-binary with RealDictCursor |
| Authentication | Custom JWT (python-jose + passlib/bcrypt) |
| Email | smtplib STARTTLS (MailerSend or any SMTP provider) |
| AI provider | Groq API (llama-3.3-70b-versatile and llama-3.1-8b-instant) |
| Hosting (backend) | Railway |
| Hosting (frontend) | GitHub Pages (via Actions) |
| CI/CD | GitHub Actions |
| Changelog generation | git-cliff |

---

## 4. Libraries Used

### Frontend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 14.2.35 | React framework with App Router, SSR/SSG, file-based routing |
| `react` | ^18 | UI component library and virtual DOM |
| `react-dom` | ^18 | DOM rendering for React |
| `@supabase/supabase-js` | ^2.99.0 | Supabase client (legacy path; used for `supabaseEnabled` guard and `Session` type) |
| `lucide-react` | ^0.577.0 | Icon components (all UI icons throughout the app) |
| `framer-motion` | ^12.35.1 | Animation library (available for future animated transitions) |

### Frontend Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5 | Static typing for all source files |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework |
| `postcss` | ^8 | CSS transform pipeline (required by Tailwind) |
| `eslint` | ^8 | JavaScript/TypeScript linter |
| `eslint-config-next` | 14.2.35 | Next.js-specific ESLint rules |
| `eslint-config-prettier` | ^10.1.8 | Disables ESLint rules that conflict with Prettier |
| `@typescript-eslint/eslint-plugin` | ^8.56.1 | TypeScript-specific lint rules |
| `@typescript-eslint/parser` | ^8.56.1 | TypeScript parser for ESLint |
| `prettier` | ^3.8.1 | Code formatter (`.prettierrc` config) |
| `vitest` | ^4.0.18 | Unit test runner (Vite-native, replaces Jest) |
| `@vitejs/plugin-react` | ^5.1.4 | React plugin for Vite/Vitest |
| `@vitest/coverage-v8` | ^4.0.18 | Code coverage reports using V8 |
| `@testing-library/react` | ^16.3.2 | React component testing utilities |
| `@testing-library/jest-dom` | ^6.9.1 | Custom DOM matchers for test assertions |
| `@testing-library/user-event` | ^14.6.1 | Simulates real user interactions in tests |
| `jsdom` | ^28.1.0 | Browser-like DOM environment for Node.js (used by Vitest) |
| `@types/node` | ^20 | TypeScript types for Node.js APIs |
| `@types/react` | ^18 | TypeScript types for React |
| `@types/react-dom` | ^18 | TypeScript types for ReactDOM |

### Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.0 | Python web framework; defines all API routes |
| `uvicorn[standard]` | 0.30.0 | ASGI server to run FastAPI; `[standard]` adds websocket/reload support |
| `psycopg2-binary` | 2.9.9 | PostgreSQL adapter for Python; uses `RealDictCursor` for dict-style rows |
| `python-jose[cryptography]` | 3.3.0 | JWT encoding/decoding; `[cryptography]` backend for HS256 |
| `passlib[bcrypt]` | 1.7.4 | Password hashing with bcrypt; used in `CryptContext` |
| `python-dotenv` | 1.0.0 | Loads `.env` file into `os.environ` at startup |
| `pydantic[email]` | 2.7.0 | Request/response data validation; `[email]` adds `EmailStr` support |
| `python-multipart` | 0.0.9 | Required by FastAPI for form data parsing |

---

## 5. Project Folder Structure

```
Notegenious_ai/
|
+-- backend/                          Python FastAPI backend
|   +-- main.py                       FastAPI app entry point; mounts CORS and both routers
|   +-- auth.py                       All auth logic: signup, OTP, login, JWT, email sending
|   +-- notes.py                      All note logic: CRUD, lock/unlock, share endpoints
|   +-- models.py                     Pydantic request and response model definitions
|   +-- database.py                   PostgreSQL connection; context-manager get_db()
|   +-- requirements.txt              Python package dependencies with pinned versions
|   +-- setup_db.py                   Utility script to run SQL migrations programmatically
|   +-- README.md                     Backend-specific setup instructions
|   +-- .env                          Local secrets (not committed; see env vars section)
|
+-- frontend/                         Next.js 14 frontend
|   +-- src/
|   |   +-- app/
|   |   |   +-- page.tsx              Root page; all global state; orchestrates all components
|   |   |   +-- layout.tsx            Root layout; sets html lang and viewport meta
|   |   |   +-- components/
|   |   |       +-- AIPanel.tsx       Right panel; all AI features (quick actions, rewrite, translate, chat)
|   |   |       +-- Editor.tsx        Center panel; title/content inputs, toolbar, AI autocomplete
|   |   |       +-- Sidebar.tsx       Left panel; note list, shared notes, search, theme toggle, API key
|   |   |       +-- AuthModal.tsx     Full-screen modal for sign in, sign up, and OTP verification
|   |   |       +-- NoteLockModal.tsx Modal for setting a lock (set mode) or unlocking (unlock mode)
|   |   |       +-- ShareModal.tsx    Modal for sharing a note by email; checks registration, sets permission
|   |   +-- lib/
|   |       +-- api.ts                All HTTP calls to the Python backend; JWT token management
|   |       +-- notes.ts              Legacy Supabase note helpers; exports hashPassword() used by lock modal
|   |       +-- supabase.ts           Supabase client setup; exports supabaseEnabled flag and types
|   +-- package.json                  Frontend npm dependencies and scripts
|   +-- next.config.js                Next.js config (output: export for static deployment)
|   +-- tsconfig.json                 TypeScript compiler config
|   +-- vitest.config.ts              Vitest test runner config
|   +-- .eslintrc.json                ESLint rules
|   +-- .prettierrc                   Prettier formatting rules
|   +-- postcss.config.mjs            PostCSS pipeline (Tailwind + autoprefixer)
|   +-- tailwind.config.ts            Tailwind theme config
|
+-- database/                         SQL schema files
|   +-- BACKEND_SETUP.sql             Creates backend_users, backend_notes tables; triggers; indexes
|   +-- SUPABASE_SETUP.sql            Supabase-variant schema (for reference)
|   +-- NOTE_SHARES_MIGRATION.sql     Creates note_shares table; run after BACKEND_SETUP.sql
|
+-- docker/                           Docker and reverse-proxy config
|   +-- Dockerfile                    Multi-stage Docker build for the full stack
|   +-- nginx.conf                    Nginx reverse-proxy config for production
|
+-- docs/                             Project documentation
|   +-- GUIDE.md                      End-user guide for using the app
|   +-- CHANGELOG.md                  Version history generated by git-cliff
|   +-- CONTRIBUTING.md               Contribution guidelines (branch names, commit convention)
|   +-- features.md                   Feature roadmap and status
|   +-- cliff.toml                    git-cliff config for changelog generation
|   +-- NoteGenius_AI_CICD_Pipeline.docx   CI/CD architecture documentation
|   +-- NoteGenius_AI_User_Guide.docx      Full user guide document
|   +-- README.md                     Docs directory readme
|
+-- .github/                          GitHub-specific config
|   +-- workflows/
|   |   +-- ci.yml                    Lint, test, and build on every push to main/develop and on PRs
|   |   +-- deploy.yml                Build and deploy to GitHub Pages on push to main
|   |   +-- docker.yml                Docker image build workflow
|   |   +-- pr-check.yml              Posts a check results table as a sticky PR comment
|   |   +-- release.yml               Creates a GitHub Release with changelog on version tags (v*)
|   +-- ISSUE_TEMPLATE/
|   |   +-- bug_report.md             Bug report issue template
|   |   +-- feature_request.md        Feature request issue template
|   +-- PULL_REQUEST_TEMPLATE.md      PR checklist template
|
+-- LICENSE                           MIT License
+-- PREVIEW.md                        This file
```

---

## 6. Frontend Code Walkthrough

### `frontend/src/app/page.tsx` — Root Page and Global State Hub

This is the single source of truth for all application state. It renders the three-panel layout (Sidebar, Editor, AIPanel) and all modals. No other component holds persistent state independently.

**State managed:**

| State variable | Type | Purpose |
|---|---|---|
| `theme` | `'dark' \| 'light'` | Current color theme; applied to `document.documentElement.className` |
| `notes` | `Note[]` | All notes for the logged-in user |
| `selectedId` | `string \| null` | ID of the currently selected own note |
| `apiKey` | `string` | Groq API key stored in `localStorage` under `groq_api_key` |
| `sidebarOpen` | `boolean` | Controls sidebar visibility on mobile |
| `aiPanelOpen` | `boolean` | Controls AI panel visibility on mobile |
| `searchQuery` | `string` | Current sidebar search string; drives `filteredNotes` |
| `apiUser` | `ApiUser \| null` | Logged-in user object from the Python backend |
| `authLoading` | `boolean` | True while the initial `/api/auth/me` call is in flight |
| `showAuthModal` | `boolean` | Controls AuthModal visibility |
| `lockModal` | `LockModalState` | Discriminated union: `{ open: false }` or `{ open: true, mode: 'set' \| 'unlock', ... }` |
| `sessionUnlocked` | `Set<string>` | Note IDs unlocked for this browser session (locked in DB but usable now) |
| `sharedNotes` | `SharedNote[]` | Notes shared with the current user by other users |
| `selectedSharedId` | `string \| null` | `share_id` of the currently selected shared note |
| `shareNoteId` | `string \| null` | Note ID passed into the ShareModal |
| `showShareModal` | `boolean` | Controls ShareModal visibility |

**Key functions:**

- `handleNewNote()` — Creates a note via `apiCreateNote()` (or local fallback), prepends to list, selects it.
- `handleSelectNote(id)` — Clears `selectedSharedId`, sets `selectedId`.
- `handleUpdateNote(id, updates)` — Optimistic local update, then fires a 2-second debounced `apiUpdateNote`.
- `handleUpdateSharedNote(id, updates)` — Same debounce pattern but calls `apiUpdateSharedNote`.
- `handleDeleteNote(id)` — Removes from state, selects next note, fires `apiDeleteNote`.
- `handleApplyAIResult(result, mode)` — Replaces or appends AI result to note content, debounced save.
- `handleShareNote(noteId)` — Sets `shareNoteId` and opens the ShareModal.
- `handleRequestLock(noteId)` — Opens lock modal in `set` mode.
- `handleRequestUnlock(noteId)` — If already session-unlocked, just selects the note. Otherwise opens modal in `unlock` mode.
- `handleSetLockConfirm(noteId, hash, hint)` — Updates note state to locked, calls `apiLockNote`.
- `handleUnlockConfirm(noteId)` — Adds noteId to `sessionUnlocked`, selects the note.
- `handleRemoveLock(noteId)` — Sets `is_locked: false` in state, clears from `sessionUnlocked`.
- `handleLogout()` — Calls `apiLogout()` (clears token), resets all state to unauthenticated defaults.

**Ctrl+S handler:** A `useEffect` attaches a `keydown` listener on `window`. It uses a ref (`selectedNoteRef`) to avoid stale closure issues, immediately cancels any pending debounce timeout, and calls `apiUpdateNote` synchronously.

**Auth bootstrap:** On mount, `apiGetMe()` is called. If a valid token exists in `localStorage`, the user is loaded and notes are fetched. If the token is missing or expired, `apiUser` stays null and the auth wall (AuthModal rendered full screen) is shown.

---

### `frontend/src/app/components/AIPanel.tsx`

The right-panel AI assistant. Makes direct `fetch` calls to the Groq API from the browser — the backend is not involved in AI calls.

**Props:**

| Prop | Type | Purpose |
|---|---|---|
| `note` | `Note \| null` | The currently selected note (provides content to AI prompts) |
| `apiKey` | `string` | Groq API key from `localStorage` |
| `theme` | `Theme` | Dark or light for styling |
| `onApplyResult` | `(result, mode) => void` | Callback to push AI output into the note |
| `onUpdate` | `(id, updates) => void` | Not currently used; kept for future inline updates |

**Local state:**

- `loading` — spinner shown in panel header during AI calls
- `aiResult` — the latest AI output shown in the result box
- `aiMode` — `'replace'` or `'append'`; shown to user below the result
- `error` — error message banner
- `copied` — temporary `true` after copy button clicked
- `chatMessages` — array of `{ role, content }` for the chat history
- `chatInput` — current text in the chat input field
- `chatLoading` — spinner inside the chat bubble area
- `showRewrite` / `showTranslate` — toggles for collapsible option grids

**Key constants:**

- `MODEL_MAIN = 'llama-3.3-70b-versatile'` — used for most AI actions
- `MODEL_FAST = 'llama-3.1-8b-instant'` — used for Fix Grammar and autocomplete

**Key functions:**

- `callGroq(apiKey, messages, model)` — Generic async function that posts to `https://api.groq.com/openai/v1/chat/completions` and returns the assistant's response string. Throws on non-OK HTTP status.
- `handleQuickAction(action)` — Runs a predefined prompt from `QUICK_ACTIONS`, stores result in `aiResult`.
- `handleRewrite(option)` — Runs a tone-rewrite prompt, sets `aiMode` to `'replace'`.
- `handleTranslate(option)` — Runs a translation prompt, sets `aiMode` to `'append'`.
- `handleApply()` — Calls `onApplyResult(aiResult, aiMode)`, then clears `aiResult`.
- `handleSendChat()` — Appends user message to `chatMessages`, calls Groq with the full history plus a system prompt that includes the note's content, appends the assistant reply.
- `checkApiAndNote()` — Guard function; sets error and returns null if API key or note content is missing.

---

### `frontend/src/app/components/Editor.tsx`

The center panel. Handles the title input, content textarea, toolbar buttons, and AI autocomplete (ghost text).

**Props:**

| Prop | Type | Purpose |
|---|---|---|
| `note` | `Note \| null` | The note to display; null shows an empty state screen |
| `theme` | `Theme` | Dark or light for styling |
| `readOnly` | `boolean` | True for read-only shared notes; disables all editing |
| `onUpdate` | `(id, updates) => void` | Fired on every title or content change |
| `onDelete` | `(id) => void` | Fired when the Delete button is clicked |
| `onShare` | `(noteId) => void \| undefined` | Shown only for own notes; opens ShareModal |

**Local state:**

- `showShareModal` — the editor has its own internal share modal trigger as well
- `suggestion` — the current ghost-text autocomplete suggestion string
- `isLoadingSuggestion` — shows a small spinner while waiting for Groq
- `suggestionTimeoutRef` — debounce ref (800ms) before fetching a suggestion
- `lastTextRef` — prevents duplicate Groq calls when content hasn't changed

**AI autocomplete logic (`getSuggestion`):**
1. Reads the Groq API key from `localStorage`.
2. Looks at the last line of the note content.
3. If it matches a math pattern (e.g., `3 + 4 =`), tries `new Function()` evaluation first (local, no API call).
4. If it looks like a question, asks Groq for a one-sentence answer.
5. Otherwise asks for a natural 5-8 word continuation.
6. Uses `llama-3.1-8b-instant` with `temperature: 0.1` and `max_tokens: 30` for speed.
7. Result is displayed as ghost text overlaid on the textarea. Tab to accept; Esc to dismiss.

**Toolbar buttons:**
- "Save .txt" — creates a `Blob`, makes a temporary `<a>` link, and triggers download.
- "Share" — only shown when `onShare` prop is provided and not in readOnly mode.
- "Delete" — hidden in readOnly mode.
- "Read only" badge — shown when `readOnly` is true.

---

### `frontend/src/app/components/Sidebar.tsx`

The left panel. Displays the note list, shared notes, search bar, user info, theme toggle, API key management, and new-note button.

**Props:**

| Prop | Type | Purpose |
|---|---|---|
| `notes` | `Note[]` | Already-filtered notes list from `page.tsx` |
| `selectedId` | `string \| null` | Highlights the selected note row |
| `apiKey` | `string` | Current Groq API key value |
| `theme` | `Theme` | Dark or light |
| `searchQuery` | `string` | Controlled search input value |
| `onSearchChange` | `(q) => void` | Fires on every search input keystroke |
| `onNewNote` | `() => void` | New Note button handler |
| `onSelectNote` | `(id) => void` | Note row click handler |
| `onDeleteNote` | `(id) => void` | Delete icon click handler |
| `onSaveApiKey` | `(key) => void` | Saves API key to localStorage |
| `onToggleTheme` | `() => void` | Switches between dark and light |
| `session` | `Session \| null` | A fake Supabase-shaped session object built in page.tsx from `apiUser` |
| `sessionUnlocked` | `Set<string>` | For showing lock/unlock icons correctly |
| `onLogout` | `() => void` | Logout button handler |
| `onRequestLock` | `(noteId) => void` | Lock icon click handler |
| `onRequestUnlock` | `(noteId) => void` | Unlock icon / locked note click handler |
| `onShowAuth` | `() => void` | Shows auth modal (used when not logged in) |
| `sharedNotes` | `SharedNote[]` | Notes shared with the user |
| `selectedSharedId` | `string \| null` | Highlights the selected shared note row |
| `onSelectSharedNote` | `(shareId) => void` | Shared note row click handler |

**Local state:**
- `showApiInput` — toggles the API key entry form
- `apiKeyInput` — controlled input for the key being typed
- `hoveredId` — tracks which note row is hovered to show action buttons

**Note rows:** Each note shows title, a truncated content preview, and last-updated date. On hover, lock/unlock and delete action buttons appear. If a note is locked and not session-unlocked, clicking the row triggers `onRequestUnlock` instead of `onSelectNote`.

**Shared notes section:** Rendered after the own-notes list when `sharedNotes.length > 0`. Each shared note shows a permission badge (View or Edit with appropriate icon and color).

**API key section:** If no key is set, shows a yellow warning box with step-by-step instructions to get a free Groq key from `console.groq.com`. Once set, shows a green "AI Key Active" badge with a "Change" link.

---

### `frontend/src/app/components/AuthModal.tsx`

A full-screen modal (not dismissable) that handles three modes:

| Mode | What it shows |
|---|---|
| `signin` | Email + password fields, "Sign In" button |
| `signup` | Full name + email + password fields, "Create Account" button |
| `otp` | Single 6-digit code input, "Verify Code" button |

**Local state:**
- `mode` — current screen (`'signin'`, `'signup'`, or `'otp'`)
- `email`, `password`, `fullName` — form field values
- `showPassword` — toggles password field visibility
- `loading` — disables button and shows spinner
- `error` — red error message below form
- `message` — green success message below form
- `pendingEmail` — the email address waiting for OTP (carried across mode change)
- `otpCode` — the 6-digit code being typed (restricted to digits, max 6 chars)

**Key functions:**
- `handleEmailAuth()` — on signup, calls `apiSignup` and transitions to `otp` mode. On signin, calls `apiLogin` and calls `onClose(user)`.
- `handleVerifyOtp()` — calls `apiVerifyOtp(pendingEmail, otpCode)`, calls `onClose(user)` on success.
- Error detection: if the error message contains "fetch" or "network", shows a specific message pointing to the backend start command.

**API calls made:** `apiSignup`, `apiLogin`, `apiVerifyOtp` (all from `src/lib/api.ts`).

---

### `frontend/src/app/components/NoteLockModal.tsx`

A modal with two operating modes controlled by the `mode` prop (a discriminated union).

**Set mode (`mode: 'set'`):**
- Shows password field, confirm password field, optional hint field.
- Validates: non-empty, min 4 chars, passwords match.
- Hashes the password client-side using `hashPassword()` (SHA-256 via `crypto.subtle.digest`).
- Calls `onConfirm(hash, hint)`.

**Unlock mode (`mode: 'unlock'`):**
- Shows password field and (if present) a hint display.
- Hashes the entered password and compares to `storedHash` from props.
- On match: calls `onConfirm()`.
- "Remove lock permanently" button: same hash check, then calls `onRemoveLock(hash)` which sends a DELETE to the backend lock endpoint.

**Note:** The backend does its own hash comparison on lock/unlock endpoints. The frontend comparison in unlock mode is a convenience UX check; the final authority is the backend.

---

### `frontend/src/app/components/ShareModal.tsx`

Modal for sharing a note with another user by email.

**Props:** `noteId`, `theme`, `onClose`.

**Local state:**
- `email` — the email being typed
- `checking` — spinner while debounce is running
- `checkResult` — `{ exists: boolean } | null` — result of the email check API call
- `permission` — `'readable'` or `'editable'` (radio buttons)
- `submitting` — spinner during the share API call
- `result` — final result from `apiShareNote`; triggers success screen and auto-close
- `error` — error text

**Flow:**
1. User types an email. A 500ms debounce fires `apiCheckEmail(email)` on every change.
2. If the email exists: shows the Read only / Read & Edit radio buttons.
3. If the email does not exist: shows an amber notice that an invitation will be sent.
4. Submit calls `apiShareNote(noteId, email, permission)`.
5. On success: shows a green checkmark with a success message, auto-closes after 2 seconds.

---

### `frontend/src/lib/api.ts`

All HTTP communication with the Python backend. No component makes `fetch` calls directly to the backend except through this module.

**Token management:**

| Function | Action |
|---|---|
| `getToken()` | Reads `ng_token` from `localStorage` |
| `setToken(token)` | Writes `ng_token` to `localStorage` |
| `clearToken()` | Removes `ng_token` from `localStorage` |

**Base request function:** `request<T>(path, options)` — attaches `Authorization: Bearer <token>` header if a token exists, parses the JSON response, throws an `Error` with the `detail` field from FastAPI error responses, and returns `undefined` for 204 No Content responses.

**Exported API functions:**

| Function | Method + Path | Description |
|---|---|---|
| `apiSignup(email, password, fullName)` | POST /api/auth/signup | Initiates signup, triggers OTP email |
| `apiVerifyOtp(email, otp)` | POST /api/auth/verify-otp | Verifies OTP, creates user, stores JWT |
| `apiLogin(email, password)` | POST /api/auth/login | Authenticates, stores JWT |
| `apiLogout()` | (local only) | Clears token from localStorage |
| `apiGetMe()` | GET /api/auth/me | Fetches current user; returns null on 401 |
| `apiUpdateProfile(updates)` | PUT /api/auth/profile | Updates full_name, groq_api_key, avatar_url |
| `apiGetNotes()` | GET /api/notes | Fetches all own notes |
| `apiCreateNote()` | POST /api/notes | Creates a new blank note |
| `apiUpdateNote(id, updates)` | PUT /api/notes/:id | Updates title, content, is_pinned, color, tags |
| `apiDeleteNote(id)` | DELETE /api/notes/:id | Deletes a note |
| `apiLockNote(id, hash, hint)` | POST /api/notes/:id/lock | Sets lock with SHA-256 hash and hint |
| `apiUnlockNote(id, hash)` | POST /api/notes/:id/unlock | Validates unlock password |
| `apiRemoveLock(id, hash)` | DELETE /api/notes/:id/lock | Permanently removes the lock |
| `isLoggedIn()` | (local only) | Returns true if a token exists in localStorage |
| `apiCheckEmail(email)` | GET /api/auth/check-email | Returns `{ exists: boolean }` |
| `apiShareNote(noteId, email, permission)` | POST /api/notes/:id/share | Shares or sends invitation |
| `apiGetSharedNotes()` | GET /api/notes/shared | Returns notes shared with the current user |
| `apiUpdateSharedNote(noteId, updates)` | PUT /api/notes/:id/shared-content | Editable collaborator updates a shared note |

**Exported TypeScript interfaces:** `ApiUser`, `ApiNote`, `ApiSharedNote` — mirror the Pydantic response models from the backend.

---

## 7. Backend Code Walkthrough

### `backend/main.py` — FastAPI App Entry Point

Initializes the FastAPI application and configures CORS and routing.

**What it does:**
- Loads `.env` via `python-dotenv`.
- Creates the `FastAPI` app with title and version metadata.
- Adds `CORSMiddleware` allowing requests from `localhost:3000`, `localhost:3001`, `localhost:3002`, `localhost:9000`, and the `FRONTEND_URL` environment variable.
- Mounts `auth_router` (from `auth.py`) and `notes_router` (from `notes.py`).

**Endpoints defined here:**

| Method | Path | Description |
|---|---|---|
| GET | `/` | Returns app name, version, status, and link to `/docs` |
| GET | `/health` | Returns `{ "status": "healthy" }` — used by Railway health checks |

---

### `backend/auth.py` — Authentication Router

Prefix: `/api/auth`

**Global setup:**
- `pwd_context = CryptContext(schemes=["bcrypt"])` — bcrypt password hashing
- `otp_store: dict` — in-memory dict mapping email to `{ otp, expires, pw_hash, full_name }` for pending signups
- JWT config read from env: `JWT_SECRET`, `JWT_ALGORITHM` (default HS256), `JWT_EXPIRE_MINUTES` (default 10080 = 7 days)

**Utility functions:**

| Function | Description |
|---|---|
| `send_otp_email(to_email, otp)` | Sends a styled HTML + plain-text OTP email via SMTP STARTTLS. Falls back to console log if SMTP is not configured. |
| `send_invite_email(to_email)` | Sends an invitation email with a link to the app URL. Used when sharing with an unregistered email. |
| `hash_password(password)` | Returns bcrypt hash via `pwd_context.hash`. |
| `verify_password(plain, hashed)` | Returns bool via `pwd_context.verify`. |
| `create_token(user_id)` | Returns a JWT with `sub=user_id` and an expiry. |
| `get_current_user_id(credentials)` | FastAPI dependency; decodes Bearer token, returns user_id string or raises 401. |

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Checks email not taken, generates 6-digit OTP, stores in `otp_store`, sends email, returns pending response |
| POST | `/api/auth/verify-otp` | No | Validates OTP and expiry, inserts user into `backend_users`, returns JWT + user |
| POST | `/api/auth/login` | No | Validates email + bcrypt password, returns JWT + user |
| GET | `/api/auth/me` | Yes | Returns current user from `backend_users` |
| PUT | `/api/auth/profile` | Yes | Updates `full_name`, `groq_api_key`, or `avatar_url` dynamically |
| POST | `/api/auth/logout` | No | Stateless; returns success message (client discards token) |
| GET | `/api/auth/check-email` | No | Returns `{ "exists": true/false }` for a given email query param |

---

### `backend/notes.py` — Notes Router

Prefix: `/api/notes`

All endpoints require authentication via `Depends(get_current_user_id)`.

**Helper function:**
- `row_to_note(row)` — converts a `RealDictRow` from psycopg2 into a `NoteResponse` Pydantic model.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/api/notes` | Returns all notes for the current user, ordered pinned first then by `updated_at` desc |
| POST | `/api/notes` | Creates a new note with UUID, calculates `word_count`, returns the created note |
| GET | `/api/notes/shared` | Returns all notes shared with the current user via `note_shares` JOIN; must be before `/{note_id}` in the file to prevent routing conflict |
| GET | `/api/notes/{note_id}` | Returns a single note owned by the current user |
| PUT | `/api/notes/{note_id}` | Dynamically updates provided fields; recalculates `word_count` if `content` is updated |
| DELETE | `/api/notes/{note_id}` | Deletes note; returns 204 No Content |
| POST | `/api/notes/{note_id}/share` | Verifies ownership, checks target email registration, upserts into `note_shares` or sends invite |
| PUT | `/api/notes/{note_id}/shared-content` | Allows an `editable` collaborator to update title/content; verifies permission in `note_shares` |
| POST | `/api/notes/{note_id}/lock` | Sets `is_locked=true`, stores `lock_password_hash` and `lock_hint` |
| POST | `/api/notes/{note_id}/unlock` | Compares provided hash against stored hash; returns note if match (session unlock) |
| DELETE | `/api/notes/{note_id}/lock` | Compares hash, then sets `is_locked=false` and clears hash and hint |

**Important routing note:** `/api/notes/shared` is declared before `/api/notes/{note_id}` in the file. FastAPI matches routes top-to-bottom, so "shared" must come first or it would be interpreted as a `note_id` value.

**Password hashing note:** The `lock_password_hash` stored in the database is a SHA-256 hex string, hashed on the frontend using the Web Crypto API (`crypto.subtle.digest`). The backend stores and compares this hash as-is; it does not rehash with bcrypt.

---

### `backend/models.py` — Pydantic Models

Defines all request and response shapes used by the API.

**Auth models:**

| Model | Fields | Used for |
|---|---|---|
| `SignupRequest` | `email`, `password`, `full_name` | POST /signup request body |
| `LoginRequest` | `email`, `password` | POST /login request body |
| `OTPVerifyRequest` | `email`, `otp` | POST /verify-otp request body |
| `ProfileUpdate` | `full_name`, `groq_api_key`, `avatar_url` (all optional) | PUT /profile request body |
| `UserResponse` | `id`, `email`, `full_name`, `avatar_url`, `groq_api_key`, `created_at` | Returned in all auth responses |
| `TokenResponse` | `access_token`, `token_type`, `user` | Returned on login and verify-otp |
| `SignupPendingResponse` | `message`, `email` | Returned on signup before OTP |

**Note models:**

| Model | Fields | Used for |
|---|---|---|
| `NoteCreate` | `title`, `content`, `color`, `tags` (all optional) | POST /notes request body |
| `NoteUpdate` | `title`, `content`, `is_pinned`, `color`, `tags` (all optional) | PUT /notes/:id request body |
| `NoteLockRequest` | `password_hash`, `lock_hint` | POST /notes/:id/lock request body |
| `NoteUnlockRequest` | `password_hash` | POST /notes/:id/unlock and DELETE /notes/:id/lock request body |
| `NoteResponse` | `id`, `user_id`, `title`, `content`, `is_locked`, `lock_hint`, `is_pinned`, `color`, `tags`, `word_count`, `created_at`, `updated_at` | Returned by all note endpoints |

**Share models:**

| Model | Fields | Used for |
|---|---|---|
| `ShareNoteRequest` | `email`, `permission` (optional) | POST /notes/:id/share request body |
| `ShareNoteResponse` | `invited`, `shared`, `permission` | Returned by share endpoint |
| `SharedNoteResponse` | All NoteResponse fields plus `share_id`, `owner_id`, `permission` | Returned by GET /notes/shared |
| `SharedNoteUpdate` | `title`, `content` (both optional) | PUT /notes/:id/shared-content request body |

---

### `backend/database.py` — PostgreSQL Connection

**How it works:**
- Reads `DATABASE_URL` from the environment.
- `get_connection()` calls `psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)` — rows are returned as dict-like objects, enabling `row["column_name"]` access.
- `get_db()` is a `@contextmanager` that yields the connection, commits on success, rolls back on any exception, and always closes the connection.

**Usage pattern in route handlers:**

```python
with get_db() as conn:
    cur = conn.cursor()
    cur.execute("SELECT * FROM backend_users WHERE id = %s", (user_id,))
    row = cur.fetchone()
```

There is no connection pooling — each request opens and closes its own connection. For higher traffic, replace with `psycopg2.pool.ThreadedConnectionPool`.

---

## 8. Database Schema

Run scripts in this order:

1. `database/BACKEND_SETUP.sql`
2. `database/NOTE_SHARES_MIGRATION.sql`

### Table: `backend_users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `uuid_generate_v4()` | User's unique identifier |
| `email` | `text` | UNIQUE, NOT NULL | User's email address |
| `password_hash` | `text` | NOT NULL | bcrypt hash of the user's password |
| `full_name` | `text` | NOT NULL, default `''` | User's display name |
| `avatar_url` | `text` | default `''` | Optional avatar image URL |
| `groq_api_key` | `text` | default `''` | User's Groq API key (stored in profile) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated by trigger on every UPDATE |

**Indexes:** `backend_users_email_idx` on `(email)`.

**Trigger:** `backend_users_updated_at` — sets `updated_at = now()` before every UPDATE.

---

### Table: `backend_notes`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `uuid_generate_v4()` | Note's unique identifier |
| `user_id` | `uuid` | FK -> `backend_users(id)` ON DELETE CASCADE, NOT NULL | Owner of the note |
| `title` | `text` | NOT NULL, default `'Untitled Note'` | Note title |
| `content` | `text` | NOT NULL, default `''` | Note body text |
| `is_locked` | `boolean` | NOT NULL, default `false` | Whether the note is password-locked |
| `lock_password_hash` | `text` | nullable | SHA-256 hex hash of the lock password |
| `lock_hint` | `text` | nullable | Optional hint shown on the unlock screen |
| `is_pinned` | `boolean` | NOT NULL, default `false` | Whether the note is pinned to the top |
| `color` | `text` | default `'default'` | Color label for the note |
| `tags` | `text[]` | NOT NULL, default `'{}'` | Array of tag strings |
| `word_count` | `integer` | NOT NULL, default `0` | Recalculated on every content update |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Note creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated by trigger on every UPDATE |

**Indexes:**
- `backend_notes_user_id_idx` on `(user_id)`
- `backend_notes_updated_at_idx` on `(user_id, updated_at DESC)`

**Trigger:** `backend_notes_updated_at` — sets `updated_at = now()` before every UPDATE.

---

### Table: `note_shares`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `uuid_generate_v4()` | Share record unique identifier |
| `note_id` | `uuid` | FK -> `backend_notes(id)` ON DELETE CASCADE, NOT NULL | The note being shared |
| `owner_id` | `uuid` | FK -> `backend_users(id)` ON DELETE CASCADE, NOT NULL | The user who owns and shared the note |
| `shared_with_user_id` | `uuid` | FK -> `backend_users(id)` ON DELETE CASCADE, NOT NULL | The user receiving access |
| `permission` | `varchar(10)` | NOT NULL, CHECK IN (`'readable'`, `'editable'`) | Access level |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | When the share was created |

**Unique constraint:** `UNIQUE (note_id, shared_with_user_id)` — one share record per note per recipient; sharing again updates the permission via `ON CONFLICT DO UPDATE`.

**Indexes:**
- `note_shares_shared_with_idx` on `(shared_with_user_id)`
- `note_shares_note_id_idx` on `(note_id)`

---

## 9. How to Run Locally

### Prerequisites

- Python 3.10+
- Node.js 20+
- A PostgreSQL database (Supabase free tier works; Railway also works)

### Step 1: Database Setup

Create a new PostgreSQL database (or use Supabase). Open the SQL editor and run the scripts in order:

```sql
-- 1. Run BACKEND_SETUP.sql first
-- 2. Run NOTE_SHARES_MIGRATION.sql second
```

Both files are in the `database/` directory.

### Step 2: Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env   # if it exists, otherwise create manually
```

Edit `backend/.env` with your values:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-random-secret-at-least-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
SMTP_HOST=smtp.mailersend.net
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

Note: SMTP is optional for local development. If `SMTP_USER` or `SMTP_PASSWORD` are empty, OTP codes and invitations are printed to the terminal console instead of sent by email.

```bash
# Start the backend
uvicorn main:app --reload --port 9000
```

The API is now available at `http://localhost:9000`. Interactive docs at `http://localhost:9000/docs`.

### Step 3: Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:9000
```

```bash
# Start the frontend dev server
npm run dev
```

The app is now available at `http://localhost:3000`.

### Step 4: Get a Groq API Key

AI features require a personal Groq API key:

1. Go to `console.groq.com`
2. Sign up for free (Google or GitHub)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)
5. Paste it into the sidebar's "Groq API Key" section in the app

### Other Frontend Commands

```bash
npm run lint          # Run ESLint
npm run format        # Auto-format with Prettier
npm run format:check  # Check formatting without writing
npm run type-check    # TypeScript type-check without emitting
npm run test          # Run Vitest tests once
npm run test:watch    # Run Vitest in watch mode
npm run test:coverage # Run tests with V8 coverage report
npm run build         # Build for production (static export to frontend/out/)
```

---

## 10. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Yes | — | Secret key for signing JWTs; use a random 32+ character string |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_EXPIRE_MINUTES` | No | `10080` | Token lifetime in minutes (10080 = 7 days) |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port (STARTTLS) |
| `SMTP_USER` | No | `""` | SMTP authentication username |
| `SMTP_PASSWORD` | No | `""` | SMTP authentication password |
| `SMTP_FROM` | No | Same as `SMTP_USER` | From address in outgoing emails |
| `FRONTEND_URL` | No | `http://localhost:3001` | Added to the CORS allowed origins list |
| `APP_URL` | No | `http://localhost:3000` | Used in invitation email links |

If `SMTP_USER` or `SMTP_PASSWORD` is empty, all email sending falls back to console logging. This is the expected behavior for local development.

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:9000` | Base URL of the Python backend; used by `src/lib/api.ts` |

The following Supabase variables are optional and only needed if using the legacy Supabase path (not required for the current Python backend):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |

If these are not set (or set to placeholder strings), `supabaseEnabled` will be `false` and the lock icon in the sidebar note list will be hidden (the lock feature works through the Python backend regardless).

---

## 11. CI/CD and Git Workflow

### Branch Naming

| Pattern | Purpose |
|---|---|
| `feat/description` | New features |
| `fix/description` | Bug fixes |
| `docs/description` | Documentation changes |
| `refactor/description` | Code refactoring without behavior change |
| `test/description` | Adding or improving tests |
| `chore/description` | Dependency updates, tooling changes |

### Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short imperative description

Examples:
feat(ai): add GPT-4 model support
fix(editor): prevent crash when note is empty
docs(readme): update deployment instructions
refactor(sidebar): extract note list into component
test(utils): add tests for sanitizeFilename
chore(deps): update framer-motion to v12
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

These types map to changelog sections via `docs/cliff.toml`:

| Commit type | Changelog section |
|---|---|
| `feat` | Features |
| `fix` | Bug Fixes |
| `docs` | Documentation |
| `style` | Styling |
| `refactor` | Refactoring |
| `perf` | Performance |
| `test` | Testing |
| `chore` | Chores |

### Versioning Rules (SemVer)

| Change type | Version bump |
|---|---|
| Bug fix, docs, refactor, test | Patch (0.0.x) |
| Single new feature | Minor (0.x.0) |
| Three or more features in a release | Major (x.0.0) |
| Any breaking API or schema change | Major (x.0.0) |

Tag format: `v1.2.3`

### GitHub Actions Workflows

#### `ci.yml` — Continuous Integration

Triggered on: push to `main` or `develop`; pull requests to `main`.

Pipeline stages (run in order):

1. **Lint & Format** (`npm run lint`, `npm run format:check`, `npm run type-check`)
2. **Tests** (needs lint to pass; runs `npm run test:coverage`; uploads coverage artifact)
3. **Build** (needs tests to pass; runs `npm run build`; verifies `frontend/out/` exists; uploads build artifact)

#### `deploy.yml` — Deploy to GitHub Pages

Triggered on: push to `main`.

Steps:
1. Runs CI checks (lint + test)
2. Builds the Next.js static export to `frontend/out/`
3. Deploys to GitHub Pages

#### `pr-check.yml` — PR Quality Gate

Triggered on: pull requests to `main`.

Runs all checks in parallel with `continue-on-error: true`, then posts a sticky table comment on the PR showing pass/fail for: ESLint, Prettier, TypeScript, Tests, Build. Fails the workflow if any check failed.

#### `release.yml` — GitHub Release

Triggered on: push of a tag matching `v*` (e.g. `v1.2.0`).

Steps:
1. Runs `git-cliff` with `docs/cliff.toml` to generate a changelog from commits since the last tag
2. Creates a GitHub Release with the generated changelog body
3. Marks as prerelease if the tag contains `beta` or `alpha`

#### `docker.yml` — Docker Build

Triggered on: push to `main`.

Builds the Docker image from `docker/Dockerfile`.

### Pull Request Process

1. Create a branch from `main` using the naming convention above.
2. Make changes. Ensure `npm run lint`, `npm run test`, `npm run build`, and `npm run type-check` all pass locally.
3. Push and open a PR. Fill in the PR template (type of change, linked issue, testing checklist).
4. The `pr-check.yml` workflow posts a check results table as a comment.
5. All five checks must pass (ESLint, Prettier, TypeScript, Tests, Build).
6. Request a review. Merge after approval.

### Railway Auto-Deploy

The backend is deployed on Railway. Railway watches the `main` branch. Every merge to `main` triggers a new Railway deployment automatically. No manual deploy step is needed for the backend.

---

*Last updated: 2026-03-10*
