# SkillSync Intern Matcher

SkillSync is a PM Internship Scheme matcher with a Vite React frontend and a Flask backend.

## Project Layout

- `frontend/` - Vite React app, static assets, styles, translations, and local fallback internship data.
- `backend/` - Flask API, recommendation engine, JSON data, optional Mongo seed helpers, tests, and Python environment files.
- `render.yaml` - Render backend blueprint.
- `vercel.json` - Vercel frontend deployment config.

## Local Development

Frontend:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m flask --app app run
```

Run backend tests:

```bash
cd backend
.venv\Scripts\python -m pytest tests -v
```
