# Deployment Guide — MongoDB + Render (Backend) + Vercel (Frontend)

## Overview
| Layer    | Platform        | URL example                              |
|----------|-----------------|------------------------------------------|
| Database | MongoDB Atlas   | cluster.mongodb.net                      |
| Backend  | Render.com      | https://pmis-backend.onrender.com        |
| Frontend | Vercel          | https://pm-internship-engine.vercel.app  |

---

## Step 1 — MongoDB Atlas (Free tier)

1. Go to https://cloud.mongodb.com → create a free account.
2. Create a **free M0 cluster** (any region, Singapore recommended for India).
3. Under **Database Access** → add a user with a strong password.
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — needed for Render).
5. Click **Connect → Drivers** → copy the connection string:
   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
   ```
6. Keep this URI handy for the next steps.

---

## Step 2 — Seed the database (once)

```bash
# Clone your repo locally and install deps
pip install -r requirements.txt

# Copy and fill in your env file
cp .env.example .env
# Edit .env — set MONGODB_URI to your Atlas URI

# Seed data
python data/seeds/seed_internships.py
python data/seeds/seed_courses.py
```

---

## Step 3 — Deploy Backend on Render

1. Push your code to GitHub.
2. Go to https://render.com → **New → Web Service** → connect your repo.
3. Set:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --config deployment/gunicorn.conf.py "backend.app:create_app()"`
4. Add **Environment Variables** in the Render dashboard:
   ```
   MONGODB_URI     = mongodb+srv://...   (your Atlas URI)
   MONGODB_DB      = pmis
   SECRET_KEY      = (generate a random 32-char string)
   FLASK_ENV       = production
   ALLOWED_ORIGINS = https://YOUR_APP.vercel.app
   ```
5. Click **Deploy**. Render will give you a URL like `https://pmis-backend.onrender.com`.
6. Verify: `curl https://pmis-backend.onrender.com/api/health`

> **Note:** Free Render instances spin down after 15 minutes of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## Step 4 — Deploy Frontend on Vercel

1. Open `frontend/src/utils/api.js` and update the base URL:
   ```js
   const API_BASE = "https://pmis-backend.onrender.com/api";
   ```
2. Go to https://vercel.com → **New Project** → import your GitHub repo.
3. Set **Root Directory** to `frontend` (if Vercel asks).
4. Add **Environment Variable** (optional, for future Vite/build use):
   ```
   VITE_API_BASE_URL = https://pmis-backend.onrender.com/api
   ```
5. Click **Deploy**. Vercel gives you `https://YOUR_APP.vercel.app`.
6. Go back to **Render → Environment** → update `ALLOWED_ORIGINS` to your Vercel URL.

---

## Local Development

```bash
# 1. Start local MongoDB (or use Atlas URI in .env)
docker run -d -p 27017:27017 mongo:7

# 2. Install and run
pip install -r requirements.txt
cp .env.example .env    # fill in MONGODB_URI
python data/seeds/seed_internships.py
python data/seeds/seed_courses.py
python backend/app.py

# 3. Open frontend
open frontend/index.html
```

---

## Environment Variables Reference

| Variable              | Required | Description                        |
|-----------------------|----------|------------------------------------|
| `MONGODB_URI`         | ✅ Yes   | Full Atlas or local connection URI |
| `MONGODB_DB`          | No       | DB name (default: `pmis`)          |
| `SECRET_KEY`          | ✅ Yes   | Flask session signing key          |
| `FLASK_ENV`           | No       | `production` or `development`      |
| `ALLOWED_ORIGINS`     | ✅ Yes   | Vercel frontend URL(s) for CORS    |
| `RECOMMENDATION_TOP_N`| No       | Max results returned (default: 5)  |
