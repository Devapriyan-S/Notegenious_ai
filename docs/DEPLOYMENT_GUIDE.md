> **IMPORTANT:** Railway now requires payment. See [FREE_DEPLOYMENT_GUIDE.md](./FREE_DEPLOYMENT_GUIDE.md) for the recommended free setup using Vercel + Render.

---

# NoteGenius AI — Complete Deployment Guide (Railway — Paid)

This guide walks you through publishing your NoteGenius AI project from your computer to the internet using **GitHub** (to store and share your code) and **Railway** (to host and run your app live). You do not need any prior deployment experience. Every step is explained in plain language with exact commands.

---

## What You Will End Up With

After following this guide:
- Your code will be safely stored on GitHub at `github.com/Devapriyan-S/Notegenious_ai`
- Your **backend** (the Python FastAPI server) will be live at a URL like `https://backend-production-xxxx.up.railway.app`
- Your **frontend** (the Next.js web interface) will be live at a URL like `https://frontend-production-xxxx.up.railway.app`
- Any future code changes you push to GitHub will **automatically redeploy** your app

---

## Before You Start — What You Need

- A computer with internet access
- A terminal / command prompt (on Linux/Mac: search "Terminal"; on Windows: use "Command Prompt" or "Git Bash")
- Your Supabase database connection string (covered in Part 2, Step 6)
- The project already on your computer at `/home/kniti/Documents/new/Notegenious_ai`

---

# PART 1 — Push Your Code to GitHub

GitHub is a website where developers store and share code. Think of it like Google Drive, but specifically designed for code. You need to push your project there first so Railway can pick it up.

---

## Step 1 — Create a GitHub Account (skip if you already have one)

1. Open your browser and go to **https://github.com**
2. Click the **"Sign up"** button in the top-right corner
3. Enter your email address, create a password, and choose a username
4. Verify your email address when GitHub sends you a confirmation email
5. You now have a GitHub account

---

## Step 2 — Create a New GitHub Repository

A "repository" (also called a "repo") is a folder on GitHub that holds your project files.

1. Log in to **https://github.com**
2. Look at the top-right corner of the page — you will see a **"+"** icon next to your profile picture
3. Click the **"+"** icon, then click **"New repository"** from the dropdown menu
4. You will see a form. Fill it in exactly like this:
   - **Repository name:** `Notegenious_ai`
   - **Description:** (optional) `AI-powered note-taking application`
   - **Visibility:** Choose either **Public** (anyone can see it) or **Private** (only you can see it). Either works for Railway.
   - **IMPORTANT — Do NOT check any of these boxes:**
     - Do NOT check "Add a README file" (you already have one)
     - Do NOT check "Add .gitignore" (you already have one)
     - Do NOT check "Choose a license"
5. Click the green **"Create repository"** button
6. GitHub will show you a page with setup instructions — you can ignore those because the steps below replace them

---

## Step 3 — Push Your Code to GitHub

Now you will send your local code to the GitHub repository you just created.

Open your terminal and run these commands one by one. Copy and paste each line exactly.

**Navigate to your project folder:**
```bash
cd /home/kniti/Documents/new/Notegenious_ai
```

**Stage all your files (prepare them for upload):**
```bash
git add -A
```

**Create a commit (a saved snapshot of your code):**
```bash
git commit -m "feat: initial release v1.0.0"
```

**Push the code to GitHub:**
```bash
git push origin main
```

### If Git Asks for Your Username and Password

When you run `git push`, Git may ask:
```
Username for 'https://github.com':
Password for 'https://...@github.com':
```

- For **Username**: type your GitHub username (the one you chose when signing up)
- For **Password**: do NOT use your GitHub login password. GitHub requires a **Personal Access Token (PAT)** instead

### How to Create a Personal Access Token (PAT)

1. Go to **https://github.com** and log in
2. Click your **profile picture** in the top-right corner
3. Click **"Settings"** from the dropdown
4. Scroll all the way down in the left sidebar and click **"Developer settings"**
5. In the left sidebar, click **"Personal access tokens"**
6. Click **"Tokens (classic)"**
7. Click the **"Generate new token"** button, then choose **"Generate new token (classic)"**
8. In the **"Note"** field, type: `railway-deploy`
9. Under **"Expiration"**, choose **"No expiration"** (or 90 days if you prefer)
10. Under **"Select scopes"**, check the box next to **"repo"** (this gives access to your repositories)
11. Scroll down and click the green **"Generate token"** button
12. GitHub will show you a long string of letters and numbers — **copy it immediately**. You will never see it again after leaving this page.
13. Go back to your terminal, paste this token when Git asks for your password

---

## Step 4 — Verify the Code is on GitHub

1. Open your browser and go to `https://github.com/Devapriyan-S/Notegenious_ai`
2. You should see all your project folders and files listed there: `backend/`, `frontend/`, `README.md`, etc.
3. If you see the files, the upload was successful

---

# PART 2 — Host Your App on Railway

Railway is a cloud hosting platform. It reads your code from GitHub, builds it, and runs it on a server so anyone in the world can access it via a URL.

Your project has two separate parts that need to run independently:
- The **backend** (Python/FastAPI server) — handles login, notes, and the database
- The **frontend** (Next.js) — the visual web interface users see in their browser

Railway will host each as its own "service" with its own public URL.

---

## Step 1 — Create a Railway Account

1. Open your browser and go to **https://railway.app**
2. Click the **"Start a New Project"** button (or "Login" if you already have an account)
3. Click **"Continue with GitHub"**
4. GitHub will ask if you want to authorize Railway — click **"Authorize Railway"**
5. Railway will redirect you back and create your account automatically using your GitHub details

---

## Step 2 — Create a New Railway Project

1. Once logged in, you will see the Railway dashboard
2. Click the **"New Project"** button
3. From the options that appear, click **"Deploy from GitHub repo"**
4. Railway will show a list of your GitHub repositories — click on **"Devapriyan-S/Notegenious_ai"**
5. Click **"Deploy Now"**
6. Railway will start analyzing your repository. A new project page will open with one service already being created.

---

## Step 3 — Configure the Backend Service

Railway created one service automatically. You will configure it as the backend.

### Rename the Service
1. Click on the service card that was auto-created
2. Click the **"Settings"** tab at the top
3. Find the **"Service Name"** field and change it to: `backend`

### Set the Root Directory
1. Still in the **"Settings"** tab, scroll down to find **"Root Directory"**
2. Click on it and type: `/backend`
3. This tells Railway to look inside the `backend/` folder of your repository

### Set the Start Command
1. Still in **"Settings"**, find **"Custom Start Command"** (sometimes called "Start Command")
2. Click on it and type exactly:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
   - `uvicorn` is the server that runs your FastAPI Python app
   - `main:app` means "find the file `main.py` and run the `app` object inside it"
   - `--host 0.0.0.0` means accept connections from anywhere (required for hosting)
   - `--port $PORT` means use whatever port Railway assigns (Railway sets this automatically)

### Add Environment Variables
Environment variables are secret settings your app needs to run. They are like a private configuration file stored securely on Railway's servers.

1. Click the **"Variables"** tab at the top of the backend service
2. Click **"New Variable"** for each of the following, adding them one at a time:

| Variable Name | Value |
|---|---|
| `DATABASE_URL` | (your Supabase connection string — see Step 6 below for how to find this) |
| `JWT_SECRET` | `NoteGeniusSecretKey2024XyZ987` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRE_MINUTES` | `10080` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `SMTP_HOST` | `smtp.mailersend.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `MS_ez44a3@test-r83ql3pyvyxgzw1j.mlsender.net` |
| `SMTP_PASSWORD` | `mssp.6ClUP89.jpzkmgq28k1g059v.LOfJdDn` |
| `SMTP_FROM` | `MS_ez44a3@test-r83ql3pyvyxgzw1j.mlsender.net` |

**Note on `FRONTEND_URL`:** Set it to `http://localhost:3000` for now. You will update it to the real frontend URL in Step 5, after the frontend is deployed.

**Note on `JWT_SECRET`:** This is a secret key used to secure user sessions. You can change it to any long random string — just never share it publicly.

### Deploy the Backend
1. Click the **"Deploy"** button (or Railway may start deploying automatically after you save variables)
2. Watch the build logs — Railway is installing Python packages from `requirements.txt` and starting the server
3. The build takes approximately 2 to 3 minutes
4. When the status shows a green dot and says **"Active"**, the backend is running

### Copy the Backend URL
1. Click on the **"Settings"** tab of the backend service
2. Scroll down to find **"Networking"** or **"Domains"**
3. You will see a public URL like: `https://backend-production-xxxx.up.railway.app`
4. **Copy this URL** — you will need it in the next step

---

## Step 4 — Add the Frontend Service

1. Go back to your Railway project main page (click the project name in the breadcrumb at the top)
2. Click the **"+ New Service"** button
3. Click **"GitHub Repo"**
4. Select **"Devapriyan-S/Notegenious_ai"** again (same repository, different service)

### Rename the Service
1. Click on this new service
2. Go to **"Settings"** tab
3. Change the **"Service Name"** to: `frontend`

### Set the Root Directory
1. Still in **"Settings"**, find **"Root Directory"**
2. Type: `/frontend`

### Add Environment Variables
1. Click the **"Variables"** tab
2. Add these two variables:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | (paste the backend URL you copied in Step 3 — example: `https://backend-production-xxxx.up.railway.app`) |
| `RAILWAY` | `true` |

**Note on `NEXT_PUBLIC_API_URL`:** This tells the frontend where to send API requests. It must be the exact URL of your backend service on Railway.

### Deploy the Frontend
1. Click **"Deploy"**
2. Railway will install Node.js packages and build the Next.js app
3. This takes approximately 3 to 5 minutes
4. When the status shows green and says **"Active"**, the frontend is live

### Copy the Frontend URL
1. In the **"Settings"** tab of the frontend service, find the **"Domains"** or **"Networking"** section
2. Copy the public URL — it will look like: `https://frontend-production-xxxx.up.railway.app`
3. **This is your app's public address.** Anyone can open it in a browser.

---

## Step 5 — Update the Backend's FRONTEND_URL

Now that the frontend is deployed and you have its real URL, update the backend so it allows the frontend to communicate with it (this is called CORS — Cross-Origin Resource Sharing).

1. Go back to the **backend** service in Railway
2. Click the **"Variables"** tab
3. Find the variable `FRONTEND_URL`
4. Click on it and change the value from `http://localhost:3000` to your actual frontend URL (example: `https://frontend-production-xxxx.up.railway.app`)
5. Click **"Save"** or press Enter
6. Railway will automatically redeploy the backend with the updated setting — wait for the green status

---

## Step 6 — Get Your Supabase DATABASE_URL

If you have not already added the `DATABASE_URL` variable in Step 3, here is how to find it:

1. Open your browser and go to **https://supabase.com**
2. Log in and click on your NoteGenius AI project
3. In the left sidebar, click **"Settings"** (the gear icon at the bottom)
4. Click **"Database"** in the settings menu
5. Scroll down to find the **"Connection string"** section
6. Make sure the tab is set to **"URI"** (not "PSQL" or "JDBC")
7. You will see a connection string that looks like this:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
   ```
8. Copy this entire string
9. Go back to the backend service in Railway → Variables tab → find `DATABASE_URL` → paste the connection string as its value
10. Railway will redeploy automatically

**Important:** The `[YOUR-PASSWORD]` part is your actual Supabase database password. The full string should have no brackets — it should be filled in with real values.

---

## Step 7 — Set Up GitHub Auto-Deploy (Railway Token)

This step connects Railway to your GitHub Actions CI/CD pipeline, so that whenever you push code to the `main` branch, Railway automatically redeploys.

### Create a Railway Token
1. In Railway, click your **account icon** in the top-right corner
2. Click **"Account Settings"**
3. Click the **"Tokens"** tab
4. Click **"Create Token"**
5. In the name field, type: `github-actions`
6. Click **"Create"**
7. Railway will show you a token — **copy it immediately**. It will not be shown again.

### Add the Token to GitHub
1. Go to your GitHub repository: `https://github.com/Devapriyan-S/Notegenious_ai`
2. Click the **"Settings"** tab at the top of the repository page (not your account settings — the repository's settings)
3. In the left sidebar, click **"Secrets and variables"**
4. Click **"Actions"** under it
5. Click the **"New repository secret"** button
6. Fill in:
   - **Name:** `RAILWAY_TOKEN`
   - **Value:** paste the Railway token you copied
7. Click **"Add secret"**

From now on, your GitHub Actions workflows can use this token to trigger Railway deployments automatically.

---

## Step 8 — Test the Deployment

Now verify that everything is working end-to-end:

1. Open your browser and go to your **frontend URL** (example: `https://frontend-production-xxxx.up.railway.app`)
2. You should see the NoteGenius AI login/signup page
3. Click **"Sign Up"** and create an account using a real email address
4. Check your email — a One-Time Password (OTP) should arrive from the MailerSend address
5. Enter the OTP to verify your account and log in
6. Try creating a note — type some content and save it
7. Refresh the page and verify the note is still there
8. If all of this works, your deployment is fully successful

### If Something Is Not Working
- Check the Railway **deployment logs**: click on the service → click the **"Deployments"** tab → click the latest deployment → click **"View logs"**
- Common issues:
  - `DATABASE_URL` is wrong or missing — double-check the Supabase connection string
  - `NEXT_PUBLIC_API_URL` has a typo — make sure it matches the backend URL exactly
  - The backend is still building — wait a few more minutes and refresh

---

## Step 9 — Set Up Branch Protection (Optional but Recommended)

Branch protection prevents accidental pushes directly to `main` and ensures code goes through review before being deployed.

1. Go to your GitHub repository: `https://github.com/Devapriyan-S/Notegenious_ai`
2. Click **"Settings"** tab
3. In the left sidebar, click **"Branches"**
4. Click **"Add branch protection rule"**
5. In the **"Branch name pattern"** field, type: `main`
6. Check these boxes:
   - **"Require a pull request before merging"**
   - **"Require status checks to pass before merging"**
7. Click the green **"Create"** button

Now nobody (including yourself) can push directly to `main`. All changes must go through a Pull Request, which runs the automated tests first.

---

# PART 3 — How Auto-Deploy Works Going Forward

Now that everything is set up, here is the flow for all future changes:

```
You make a code change on your computer
          |
          v
git add -A && git commit -m "your message" && git push origin main
          |
          v
GitHub receives your code
          |
          v
GitHub Actions runs automatically:
  - Checks code formatting (lint)
  - Runs the test suite
  - If all pass: Railway deploys the new version
          |
          v
Your live app is updated (usually within 3-5 minutes)
```

### Working With Pull Requests (the Safer Way)

If you have branch protection enabled (Step 9), the flow is:

```
You make changes on a feature branch (not main)
          |
          v
git push origin your-feature-branch
          |
          v
You open a Pull Request on GitHub
          |
          v
GitHub Actions runs CI checks (lint, tests)
          |
          v
You (or a teammate) reviews and merges the PR to main
          |
          v
Railway auto-deploys the merged code
```

This ensures broken code never reaches your live app.

---

# Quick Reference — All Commands

```bash
# Navigate to your project
cd /home/kniti/Documents/new/Notegenious_ai

# Push all changes to GitHub
git add -A
git commit -m "your commit message here"
git push origin main

# Check current git status
git status

# See recent commits
git log --oneline -10
```

---

# Summary of All URLs and Services

| Item | Location |
|---|---|
| GitHub repository | `https://github.com/Devapriyan-S/Notegenious_ai` |
| Railway dashboard | `https://railway.app/dashboard` |
| Backend service | `https://backend-production-xxxx.up.railway.app` (your actual URL will be different) |
| Frontend (your app) | `https://frontend-production-xxxx.up.railway.app` (your actual URL will be different) |
| Supabase dashboard | `https://supabase.com/dashboard` |

---

*Guide written for NoteGenius AI v1.0.0 — March 2026*
