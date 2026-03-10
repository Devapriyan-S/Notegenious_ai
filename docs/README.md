# NoteGenius AI

```
  _   _       _       ____            _           ___     ___
 | \ | | ___ | |_ ___|  _ \ ___ _ __ (_)_   _ ___|  _ \  |_ _|
 |  \| |/ _ \| __/ _ \ | | / _ \ '_ \| | | | / __| |_) |  | |
 | |\  | (_) | ||  __/ |_| |  __/ | | | | |_| \__ \  __/   | |
 |_| \_|\___/ \__\___|____/ \___|_| |_|_|\__,_|___/_|     |___|

        AI-Powered Smart Notebook — Runs 100% in the Browser
```

[![CI](https://github.com/Devapriyan-S/Notegenious_ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Devapriyan-S/Notegenious_ai/actions/workflows/ci.yml)
[![Deploy](https://github.com/Devapriyan-S/Notegenious_ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/Devapriyan-S/Notegenious_ai/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://devapriyan-s.github.io/Notegenious_ai)

---

## What is NoteGenius AI?

NoteGenius AI is a beautiful, AI-powered smart notebook that runs **entirely in your browser** — no backend required. Write notes, dictate with your voice, and let AI help you summarize, expand, rewrite, translate, and chat about your content.

**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS + Framer Motion + Groq API

---

## Features

### Notes Management
- Create, edit, and delete notes
- Real-time search across title and content
- Auto-saves in browser state
- Export any note as a `.txt` file

### Voice Dictation
- Uses the built-in Web Speech API (no API key needed)
- Real-time transcript display
- Toggle start/stop with one click

### AI Quick Actions (powered by Groq)
| Action | Description |
|--------|-------------|
| Summarize | Bullet-point summary of your note |
| Expand | Expand short notes to detailed paragraphs |
| Fix Grammar | Correct grammar and spelling (replaces content) |
| Key Points | Numbered key points and action items |
| ELI5 | Simplify complex content for anyone |

### Rewrite As
Rewrite your note in any tone: Professional, Casual, Academic, Persuasive, or Creative.

### Translate To
Translate your note to: Spanish, French, German, Japanese, Chinese, Arabic, or Tamil.

### Chat with Note
Have a full conversation with AI about your current note. The AI reads the note as context.

### Beautiful UI
- Dark/light mode toggle
- Glassmorphism design with blur effects
- Framer Motion animations throughout
- Purple/indigo gradient theme
- Responsive layout (3-column on desktop)

---

## Quick Start

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com) (for AI features)

### Installation

```bash
git clone https://github.com/Devapriyan-S/Notegenious_ai.git
cd Notegenious_ai
npm install
npm run dev
```

Open [http://localhost:3000/Notegenious_ai](http://localhost:3000/Notegenious_ai)

### Setting Up Your Groq API Key

1. Go to [console.groq.com](https://console.groq.com) and create a free account
2. Generate an API key
3. In the app, click "Groq API Key" at the bottom of the sidebar
4. Paste your key and click "Save Key"
5. The green dot confirms it is set

Your API key is stored locally in your browser — never sent to any server other than Groq directly.

---

## Screenshots

> _Screenshots coming soon. Run the app locally to see the full UI._

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production (outputs to out/)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

---

## Deployment

This app deploys automatically to GitHub Pages when you push to `main`.

**Live URL:** `https://devapriyan-s.github.io/Notegenious_ai`

### Manual Deploy

```bash
npm run build
# The out/ directory is the static site
```

### Docker

```bash
docker build -t notegenius-ai .
docker run -p 80:80 notegenius-ai
```

---

## Project Structure

```
src/app/
  layout.tsx           # Root layout
  page.tsx             # Main app (all state management)
  globals.css          # Global styles
  components/
    Sidebar.tsx        # Left panel: notes + search + API key
    Editor.tsx         # Center panel: title + content + voice
    AIPanel.tsx        # Right panel: all AI features + chat
tests/
  setup.ts             # Vitest mocks
  utils.test.ts        # Utility function tests
  noteManager.test.ts  # Note CRUD tests
.github/workflows/
  ci.yml               # Lint + test + build on every push
  deploy.yml           # Auto-deploy to GitHub Pages
  docker.yml           # Build and push Docker image
  release.yml          # Create GitHub Release on tag
  pr-check.yml         # PR quality gate with sticky comment
```

---

## AI Models Used

| Model | Used For |
|-------|----------|
| `llama-3.3-70b-versatile` | All complex AI tasks |
| `llama-3.1-8b-instant` | Grammar fix (fast) |

Both are free via the Groq API.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 NoteGenius AI Contributors
