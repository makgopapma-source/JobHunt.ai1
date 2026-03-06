# 🚀 JobHunt AI — Deployment Guide

Get your app live in under 30 minutes. Everything is free.

---

## What you need

- [GitHub](https://github.com) account (free)
- [Vercel](https://vercel.com) account (free)
- Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
- Your Adzuna credentials (already in .env.example)

---

## Step 1 — Upload to GitHub

1. Go to [github.com](https://github.com) → click **"+"** → **"New repository"**
2. Name it `jobhunt-ai`, click **Create repository**
3. Open a terminal in this folder and run:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jobhunt-ai.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username

---

## Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **"Add New Project"**
3. Select your `jobhunt-ai` repo → click **Import**
4. Set **Framework Preset** to **Vite**
5. Click **Deploy** ✅

---

## Step 3 — Add your secret keys

This keeps all your API keys hidden from the public:

1. In Vercel → your project → **Settings** → **Environment Variables**
2. Add these one by one:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your key from console.anthropic.com |
| `ADZUNA_APP_ID` | `d3ad4caa` |
| `ADZUNA_API_KEY` | `8095a7e3576f82dd13ebe0377e97ecad` |

3. Click **Save**
4. Go to **Deployments** → three dots on latest → **Redeploy**

Your app is now live at `https://jobhunt-ai.vercel.app` 🎉

---

## Run locally (optional)

```bash
npm install
cp .env.example .env.local
# .env.local already has your Adzuna keys
# Add your Anthropic key to .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## How it works

```
Your CV (PDF)
     ↓
Search "Developer" + "Johannesburg"
     ↓
/api/jobs  →  Adzuna API  →  8 real SA job listings
     ↓
/api/analyze  →  Claude AI  →  Score each job vs your CV
     ↓
Results sorted by best match 🏆
```

## Security

```
Browser  →  /api/jobs (Vercel server)     →  Adzuna
Browser  →  /api/analyze (Vercel server)  →  Anthropic Claude
               ↑
         All API keys live here
         Nobody can see them
```

## Project files

```
jobhunt-ai/
├── api/
│   ├── jobs.js        ← Fetches jobs from Adzuna (secure)
│   └── analyze.js     ← Scores jobs with Claude AI (secure)
├── src/
│   ├── main.jsx       ← React entry point
│   └── App.jsx        ← Main app UI
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```
