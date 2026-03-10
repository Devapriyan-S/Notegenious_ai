# Planner — CI/CD and Railway Deployment Setup

## Task Summary
Set up Railway hosting config, update all GitHub CI/CD workflows, write a comprehensive root README, update PR template and CONTRIBUTING guide, document branch protection, and enforce semantic versioning via git-cliff and pr-check workflow.

---

## Key Findings from Codebase Analysis

### Current State
- frontend/ uses `output: 'export'` + `basePath: '/Notegenious_ai'` in next.config.js — this is GitHub Pages mode
- Railway requires server mode (no output:export) — DECISION: do NOT touch next.config.js; document the override in railway.toml using a build command that sets RAILWAY=true, and update next.config.js minimally to read that env var
- Backend: FastAPI on port 9000 locally, Railway injects $PORT — uvicorn start command must use $PORT
- backend/main.py: CORS already reads FRONTEND_URL from env — Railway will set this
- Existing workflows: ci.yml (frontend-only lint/test/build), deploy.yml (GitHub Pages), docker.yml, release.yml (git-cliff), pr-check.yml (frontend quality gate)
- docs/cliff.toml: has conventional commit parsers (feat, fix, docs, etc.) — needs "bug", "feature", "release" keywords added
- .github/PULL_REQUEST_TEMPLATE.md: exists, needs backend checklist + convention reminders
- docs/CONTRIBUTING.md: exists, kept as-is (full guide)
- .github/CONTRIBUTING.md: does not exist — will create lightweight version pointing to docs/CONTRIBUTING.md
- README.md: does NOT exist at project root (only in docs/) — will CREATE at root
- docs/RAILWAY_SETUP.md: does not exist — will CREATE

### What Does NOT Change
- frontend/ source code (no .tsx, .ts changes)
- backend/ source code (no .py changes)
- docker/ files (Dockerfile, nginx.conf)
- database/ files
- docs/cliff.toml conventional commit parsers (only adding new ones)
- docs/CONTRIBUTING.md (kept as full reference doc)
- .github/workflows/docker.yml (not in scope)

---

## Files to Create or Modify (in order)

### 1. railway.toml (CREATE at /home/kniti/Documents/new/Notegenious_ai/railway.toml)
Railway monorepo config. Defines two services: backend and frontend.
- Backend: source=backend, build=pip install, start=uvicorn main:app --host 0.0.0.0 --port $PORT
- Frontend: source=frontend, build uses RAILWAY=true npm ci && npm run build, start=npm run start
- NOTE: Railway reads railway.toml for service configuration. For monorepos, each service has a `source` pointing to the subdirectory.

Content:
```toml
# Railway Monorepo Configuration
# Two services: backend (FastAPI) and frontend (Next.js server mode)
# Set environment variables in the Railway dashboard per service.

[build]
builder = "nixpacks"

# ── Backend Service ───────────────────────────────────────────────
[[services]]
name = "backend"
source = "backend"

[services.build]
buildCommand = "pip install -r requirements.txt"

[services.deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30

# ── Frontend Service ──────────────────────────────────────────────
[[services]]
name = "frontend"
source = "frontend"

[services.build]
buildCommand = "npm ci && npm run build"

[services.deploy]
startCommand = "npm run start"
healthcheckPath = "/"
healthcheckTimeout = 30
```

### 2. frontend/next.config.js (MODIFY — minimal change)
Add Railway server-mode support via RAILWAY env var. When RAILWAY=true, skip `output: 'export'` and `basePath`. Otherwise keep existing GitHub Pages config. This allows both deployments to work from one config.

Current content:
```js
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Notegenious_ai' : '',
  images: { unoptimized: true },
  trailingSlash: true,
};
module.exports = nextConfig;
```

New content:
```js
/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY === 'true';

const nextConfig = isRailway
  ? {
      // Railway server mode — no static export, no basePath
      images: { unoptimized: true },
    }
  : {
      // GitHub Pages static export mode
      output: 'export',
      basePath: isProd ? '/Notegenious_ai' : '',
      images: { unoptimized: true },
      trailingSlash: true,
    };

module.exports = nextConfig;
```

Railway dashboard must set env var: RAILWAY=true for the frontend service.

### 3. .github/workflows/ci.yml (MODIFY — full rewrite)
Add backend CI job. Keep existing frontend jobs. Update build verification to not assume `out/` directory (since Railway mode skips static export).

Changes:
- Add `backend` job: setup-python 3.11, pip install -r requirements.txt, py_compile all .py files, pytest if tests/ exists
- In `build` job: remove the `if [ -d "frontend/out" ]` hard-fail check (replace with informational echo)
- Keep lint and test jobs as-is

### 4. .github/workflows/deploy.yml (MODIFY — full rewrite)
Replace GitHub Pages deployment with Railway deployment.

New behavior:
- Trigger: push to main only (existing)
- First run CI checks inline (npm ci, lint, test for frontend; pip + py_compile for backend)
- Then deploy via Railway CLI using RAILWAY_TOKEN secret
- Deploy both frontend and backend services

### 5. .github/workflows/pr-check.yml (MODIFY)
Add two new checks BEFORE the existing frontend quality checks:
1. Branch name convention check: must start with feature/, bug/, or release/
2. PR title convention check: must contain feat, feature, fix, bug, or release (case-insensitive)
Keep existing frontend npm checks and sticky comment.
Update sticky comment table to include the new convention checks.

### 6. .github/workflows/release.yml (MODIFY — minor)
Already good. Minor improvements:
- Add explicit comment about tag format (v{major}.{minor}.{patch})
- Change OUTPUT env var path to docs/CHANGELOG.md so it writes to the right place

### 7. docs/cliff.toml (MODIFY)
Add "bug", "feature", "release" commit parsers alongside existing conventional commit parsers.

New parsers to add:
- `{ message = "^bug|.*bug.*", group = "Bug Fixes" }` — catches "bug: ..." style commits
- `{ message = "^feature|.*feature.*", group = "Features" }` — catches "feature: ..." style
- `{ message = "^release|.*release.*", group = "Releases" }` — catches "release: ..." style

Also add `filter_commits = false` to ensure all commits are included.

### 8. .github/PULL_REQUEST_TEMPLATE.md (MODIFY)
Add to existing template:
- Backend testing checklist (pip install, py_compile, pytest)
- Branch naming reminder (bug/*, feature/*, release/*)
- Commit message convention reminder

### 9. .github/CONTRIBUTING.md (CREATE)
Lightweight .github/ version of contribution guide. Points to docs/CONTRIBUTING.md for full details. Covers:
- Quick branch naming rules
- Commit message conventions for version bumping
- PR process summary

### 10. README.md (CREATE at /home/kniti/Documents/new/Notegenious_ai/README.md)
Comprehensive root README. Sections:
1. Project title + badges (CI, Deploy, License, version)
2. What is NoteGenius AI (overview)
3. Features (notes, voice, AI, sharing, locking)
4. Tech Stack table (frontend + backend + DB + email)
5. Project Structure (full tree)
6. Local Development Setup (frontend section + backend section)
7. Environment Variables (frontend .env.local table + backend .env table)
8. Running Tests
9. Git Branching and Versioning Strategy (semantic versioning table + branch naming + commit rules)
10. GitHub Branch Protection Rules (document what to set in GitHub settings)
11. Railway Deployment (summary + link to docs/RAILWAY_SETUP.md)
12. Contributing (link to docs/CONTRIBUTING.md and .github/CONTRIBUTING.md)
13. License

### 11. docs/RAILWAY_SETUP.md (CREATE)
Detailed Railway deployment guide:
- Prerequisites (Railway account, Railway CLI install)
- Step 1: Create Railway project from GitHub repo
- Step 2: Add Backend service (source: backend/)
- Step 3: Add Frontend service (source: frontend/)
- Step 4: Environment variables table for each service
- Step 5: Custom domain setup
- Step 6: Auto-deploy on push to main
- Troubleshooting section

---

## Environment Variables Reference

### Backend service (set in Railway dashboard)
| Variable | Example | Notes |
|---|---|---|
| DATABASE_URL | postgresql://user:pass@host:5432/db | Supabase connection string |
| SECRET_KEY | random-32-char-string | JWT signing secret |
| ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | Token expiry |
| MAILERSEND_API_KEY | mlsn.xxx | MailerSend API key |
| MAILERSEND_FROM_EMAIL | noreply@yourdomain.com | Verified sender |
| FRONTEND_URL | https://yourapp-frontend.up.railway.app | Frontend Railway URL for CORS |

### Frontend service (set in Railway dashboard)
| Variable | Example | Notes |
|---|---|---|
| RAILWAY | true | Enables server mode in next.config.js |
| NEXT_PUBLIC_API_URL | https://yourapp-backend.up.railway.app | Backend Railway URL |
| NEXT_PUBLIC_SUPABASE_URL | https://xxx.supabase.co | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJ... | Supabase anon key |

---

## Versioning Strategy

| Change Type | Version Bump | Branch Naming | Commit Must Contain |
|---|---|---|---|
| Bug fix | patch: 1.0.0 → 1.0.1 | bug/short-description | "fix" or "bug" |
| New feature | minor: 1.0.0 → 1.1.0 | feature/short-description | "feat" or "feature" |
| Major/3+ features | major: 1.0.0 → 2.0.0 | release/v2.0.0 | "release" |

Tagging process:
```bash
git tag v1.0.1
git push origin v1.0.1
```
This triggers release.yml → git-cliff generates changelog → GitHub Release created.

---

## Implementation Order
1. Create railway.toml
2. Modify frontend/next.config.js (add RAILWAY env var check)
3. Modify .github/workflows/ci.yml (add backend job)
4. Modify .github/workflows/deploy.yml (Railway deploy)
5. Modify .github/workflows/pr-check.yml (add convention checks)
6. Modify .github/workflows/release.yml (minor improvements)
7. Modify docs/cliff.toml (add bug/feature/release parsers)
8. Modify .github/PULL_REQUEST_TEMPLATE.md (add backend + convention items)
9. Create .github/CONTRIBUTING.md
10. Create README.md at project root
11. Create docs/RAILWAY_SETUP.md
