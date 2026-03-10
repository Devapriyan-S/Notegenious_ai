# NoteGenius AI — Project Memory

## Overview
NoteGenius AI is an AI-powered smart notebook that runs entirely in the browser.
- Tech Stack: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- AI Backend: Groq API (free, called directly from browser)
- Deployment: GitHub Pages (static export)
- GitHub Repo: https://github.com/Devapriyan-S/Notegenious_ai.git

## Project Status
- Initial build: 2026-03-08
- Voice dictation enhanced: 2026-03-08

## Key Decisions
- Static export (output: 'export' in next.config.js)
- basePath: '/Notegenious_ai'
- No Next.js API routes (100% client-side)
- Groq API key stored in localStorage by user under key `groq_api_key`
- Web Speech API for voice dictation (no key needed)
- Vitest for testing (not Jest)
- Framer Motion for all animations

## Voice Dictation Architecture (Editor.tsx)
- `noteContentRef` — ref synced to `note.content` via useEffect; used in speech callbacks to avoid stale closure bug
- `finalTranscriptRef` — accumulates final speech segments across onresult calls
- `meetingModeRef` / `currentSpeakerRef` — refs synced to meetingMode/currentSpeaker state for use inside speech callbacks
- `handleFinalTranscript` — async function that translates (via Groq) then appends to note
- `translateToNoteLanguage` — calls Groq llama-3.3-70b-versatile; returns `{translated, detectedLang}`
- `recognition.lang = ''` — auto-detects spoken language
- Meeting Mode: text formatted as `[Speaker N]: text\n`; 2-second silence timer auto-increments speaker
- Next Speaker button: only visible when meetingMode && isListening
- Translating... banner shown during Groq API call; "Translated from [lang]" badge auto-hides after 3s
