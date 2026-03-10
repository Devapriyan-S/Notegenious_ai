# NoteGenius AI — Free Deployment Guide (Vercel + Render)

This guide walks you through deploying NoteGenius AI completely for free using:
- **Vercel** for the frontend (Next.js) — always fast, no sleep
- **Render** for the backend (FastAPI/Python) — free tier, wakes on request

No credit card is required for either service.

---

## What You Will End Up With

- Frontend live at a URL like `https://notegenious-ai.vercel.app`
- Backend live at a URL like `https://notegenious-backend.onrender.com`
- Auto-deploy on every push to `main`

---

## Before You Start

- A computer with internet access
- A GitHub account with the `Notegenious_ai` repo already pushed
- Your Supabase database connection string (see Part 6 below if you need it)

---

# PART 1 — Push to GitHub

If you have not pushed your code to GitHub yet, run these commands:

```bash
cd /home/kniti/Documents/new/Notegenious_ai
git add -A
git commit -m "feat: initial release v1.0.0"
git push origin main
```

If Git asks for a username and password, use your GitHub username and a Personal Access Token (PAT) as the password. To create a PAT: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → check "repo" scope → copy the token.

---

# PART 2 — Host Backend on Render (Free)

## Step 1 — Create a Render Account

1. Open your browser and go to **https://render.com**
2. Click **"Get Started for Free"**
3. Click **"Continue with GitHub"**
4. Authorize Render to access your GitHub account
5. Your account is now created

## Step 2 — Create a New Web Service

1. On the Render dashboard, click **"New +"** in the top-right
2. Click **"Web Service"**
3. Click **"Connect account"** under GitHub if prompted, then authorize
4. Find and click on your **`Notegenious_ai`** repository
5. Fill in the service settings:
   - **Name:** `notegenious-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Free`
6. Click **"Create Web Service"**

Render will start building and deploying your backend. This takes about 2-4 minutes.

## Step 3 — Add Environment Variables

While the deploy is running (or after), click the **"Environment"** tab in your Render service and add these variables one by one:

| Variable | Value |
|---|---|
| `DATABASE_URL` | (your Supabase connection string — see Part 6) |
| `JWT_SECRET` | `NoteGeniusSecretKey2024XyZ987` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRE_MINUTES` | `10080` |
| `FRONTEND_URL` | (leave blank for now — fill in after Vercel deploy) |
| `SMTP_HOST` | `smtp.mailersend.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `MS_ez44a3@test-r83ql3pyvyxgzw1j.mlsender.net` |
| `SMTP_PASSWORD` | `mssp.6ClUP89.jpzkmgq28k1g059v.LOfJdDn` |
| `SMTP_FROM` | `MS_ez44a3@test-r83ql3pyvyxgzw1j.mlsender.net` |

After adding all variables, click **"Save Changes"**. Render will automatically redeploy.

## Step 4 — Wait for Deploy and Copy the Backend URL

1. Click the **"Logs"** tab to watch the deployment progress
2. When you see `Application startup complete` in the logs, the backend is live
3. At the top of the page you will see a URL like `https://notegenious-backend.onrender.com`
4. **Copy this URL** — you will need it for the frontend setup

## Step 5 — Get the Render Deploy Hook (for Auto-Deploy)

1. In your Render service, click the **"Settings"** tab
2. Scroll down to find **"Deploy Hook"**
3. Copy the full URL shown there — it looks like `https://api.render.com/deploy/srv-xxxx?key=yyyy`
4. Go to your GitHub repository: `https://github.com/Devapriyan-S/Notegenious_ai`
5. Click **"Settings"** (repository settings, not your account)
6. Click **"Secrets and variables"** → **"Actions"**
7. Click **"New repository secret"**
8. Fill in:
   - **Name:** `RENDER_DEPLOY_HOOK`
   - **Value:** paste the deploy hook URL
9. Click **"Add secret"**

Now whenever you push to `main`, GitHub Actions will trigger a Render redeploy automatically.

---

# PART 3 — Host Frontend on Vercel (Free)

## Step 1 — Create a Vercel Account

1. Open your browser and go to **https://vercel.com**
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Your account is now created

## Step 2 — Import Your Project

1. On the Vercel dashboard, click **"Add New Project"**
2. Find your **`Notegenious_ai`** repository in the list and click **"Import"**
3. On the project configuration screen:
   - **Root Directory:** click "Edit" and type `frontend`
   - **Framework Preset:** should auto-detect as `Next.js` — if not, select it manually
4. Do not change any other settings yet

## Step 3 — Add the Environment Variable

1. Still on the configuration screen, scroll down to find **"Environment Variables"**
2. Click to expand it
3. Add one variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** paste your Render backend URL (example: `https://notegenious-backend.onrender.com`)
4. Click **"Add"**

## Step 4 — Deploy

1. Click the **"Deploy"** button
2. Wait 2-3 minutes while Vercel builds your Next.js app
3. When the deployment finishes, Vercel will show you a confetti screen and your frontend URL
4. The URL will look like: `https://notegenious-ai.vercel.app`
5. **Copy this URL**

## Step 5 — Update FRONTEND_URL in Render

Now that you have the real frontend URL, update the backend so it allows CORS requests from the frontend:

1. Go to **https://render.com** → click on your `notegenious-backend` service
2. Click the **"Environment"** tab
3. Find `FRONTEND_URL` and click the edit icon
4. Set its value to your Vercel frontend URL (example: `https://notegenious-ai.vercel.app`)
5. Click **"Save Changes"**
6. Render will automatically redeploy the backend — wait for the green status

---

# PART 4 — Auto-Deploy Setup

### Vercel (Frontend)
Vercel automatically watches your GitHub repository and deploys on every push to `main`. There is nothing extra to set up — it works immediately after the initial import.

### Render (Backend)
The deploy hook you added to GitHub secrets in Part 2 Step 5, combined with the `.github/workflows/deploy.yml` file in the repository, means every push to `main` also triggers a Render redeploy.

The full auto-deploy flow is:
```
You push code to main
         |
         v
GitHub Actions runs CI checks (lint + tests)
         |
         v
If CI passes:
  - Render deploy hook is called → backend redeploys
  - Vercel detects the push automatically → frontend redeploys
         |
         v
Both services are updated within 3-5 minutes
```

---

# PART 5 — Important Notes About the Free Tier

### Render Free Tier — Backend Sleep
The Render free tier "sleeps" the backend after 15 minutes of no incoming traffic. When someone makes the first request after a sleep period, the backend takes approximately 30 seconds to wake up before responding. After it wakes, all subsequent requests are fast.

This is completely normal on the free tier and does not affect data or functionality.

**To prevent sleeping**, you can use a free uptime monitoring service:
1. Go to **https://uptimerobot.com** and create a free account
2. Add a new monitor:
   - Monitor Type: `HTTP(s)`
   - URL: your Render backend URL + `/health` (example: `https://notegenious-backend.onrender.com/health`)
   - Monitoring Interval: `Every 5 minutes`
3. UptimeRobot will ping your backend every 5 minutes, keeping it awake

### Vercel — No Sleep
The Vercel frontend has no sleep limitation. It is always fast and always available on the free tier.

### Vercel Free Tier Limits
- 100 GB bandwidth per month
- Unlimited deployments
- Sufficient for personal projects and small teams

### Render Free Tier Limits
- 750 hours of runtime per month (enough for one always-on service)
- 512 MB RAM
- Shared CPU

---

# PART 6 — How to Find Your Supabase DATABASE_URL

1. Open your browser and go to **https://supabase.com**
2. Log in and click on your NoteGenius AI project
3. In the left sidebar, click **"Settings"** (the gear icon near the bottom)
4. Click **"Database"** in the settings menu
5. Scroll down to find the **"Connection string"** section
6. Make sure the tab is set to **"URI"** (not "PSQL" or "JDBC")
7. You will see a connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
   ```
8. Copy this entire string — the `[YOUR-PASSWORD]` and `[YOUR-HOST]` parts will be filled in with your actual values (no brackets in the real string)
9. Paste this as the value of `DATABASE_URL` in Render

---

# PART 7 — Branch Protection Setup (Recommended)

Branch protection prevents anyone (including yourself) from pushing directly to `main` without going through a Pull Request. This ensures broken code never reaches your live app.

1. Go to your GitHub repository: `https://github.com/Devapriyan-S/Notegenious_ai`
2. Click the **"Settings"** tab at the top of the repository page
3. In the left sidebar, click **"Branches"**
4. Click **"Add branch protection rule"**
5. In the **"Branch name pattern"** field, type: `main`
6. Check these boxes:
   - **"Require a pull request before merging"**
   - **"Require status checks to pass before merging"**
   - Under "Require status checks", search for and add: `CI Checks`
7. Click the green **"Create"** button

After this is set up, the workflow for making changes is:
```bash
# Create a feature branch
git checkout -b my-feature

# Make your changes, then commit
git add -A
git commit -m "feat: describe your change"
git push origin my-feature

# Open a Pull Request on GitHub
# Wait for CI to pass, then merge to main
# Vercel and Render will auto-deploy the merged code
```

---

# Summary of Services and URLs

| Service | URL |
|---|---|
| GitHub repository | `https://github.com/Devapriyan-S/Notegenious_ai` |
| Vercel dashboard | `https://vercel.com/dashboard` |
| Render dashboard | `https://render.com/dashboard` |
| Frontend (your app) | `https://notegenious-ai.vercel.app` (exact URL shown after deploy) |
| Backend API | `https://notegenious-backend.onrender.com` (exact URL shown in Render) |
| Supabase dashboard | `https://supabase.com/dashboard` |
| UptimeRobot (optional) | `https://uptimerobot.com` |

---

*Guide written for NoteGenius AI v1.0.0 — March 2026*
