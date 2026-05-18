# SkillSync Intern Matcher

SkillSync is a PM Internship Scheme matcher with a Vite React frontend and a Flask backend.

## Project Layout

- `frontend/` - Vite React app, static assets, styles, translations, and API client.
- `backend/` - Flask API, Excel-backed internship source, recommendation engine, runtime course data, tests, and Python environment files.
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

## Deployment Notes

- The internship workbook is committed at `backend/data/merged_normalized_dataset.xlsx`.
- Set `INTERNSHIP_SOURCE=excel` and `INTERNSHIP_EXCEL_PATH=backend/data/merged_normalized_dataset.xlsx` on the backend host.
- Use `UPLOAD_STORAGE=mongodb` in deployment so resumes, marksheets, and application documents are stored in MongoDB/GridFS.
- Configure `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY`, and `ALLOWED_ORIGINS` as deployment secrets/env vars.
- Set the frontend `VITE_API_BASE_URL` to the deployed backend API URL, for example `https://your-backend.onrender.com/api`.
