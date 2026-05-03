# Deployment Guide

## Overview

| Layer | Platform | Source |
| --- | --- | --- |
| Frontend | Vercel | `frontend/` Vite React app |
| Backend | Render | `backend/` Flask API |
| Data | JSON by default | `backend/data/*.json` |
| MongoDB | Optional | Only used by seed helpers |

## Backend on Render

1. Push the repo to GitHub.
2. Create a Render Blueprint from `render.yaml`.
3. Set `ALLOWED_ORIGINS` to the deployed Vercel URL.
4. Render installs `backend/requirements.txt` and starts `backend.app:create_app()`.
5. Verify `/api/health`.

## Frontend on Vercel

1. Import the repo in Vercel.
2. Use the root `vercel.json`.
3. Set `VITE_API_BASE_URL` to the Render backend API URL, for example `https://skillsync-backend.onrender.com/api`.
4. Vercel builds the Vite app from `frontend/package.json`.

## Local Development

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m flask --app app run
```

Frontend:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Tests:

```bash
cd backend
.venv\Scripts\python -m pytest tests -v
```
