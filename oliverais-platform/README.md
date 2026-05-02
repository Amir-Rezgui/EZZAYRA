# EZZAYRA Platform

Web platform for olive grove analysis with map, NDVI demo, and voice chatbot. This repo contains:

- frontend (React + Vite + Tailwind + Leaflet)
- backend (FastAPI + placeholders, optional chatbot deps)

## Quick start (5 commands)

> Windows PowerShell

1. `cd EZZAYRA\backend`
2. `py -m venv .venv`
3. `.\.venv\Scripts\pip install -r requirements.txt`
4. `.\.venv\Scripts\uvicorn main:app --reload`
5. `cd ..\frontend; npm install; npm run dev`

Frontend runs at http://localhost:5173
Backend runs at http://localhost:8000

## Environment

- Backend: copy `.env.example` to `.env` and update values if needed.
- Frontend: copy `.env.example` to `.env` and update API URL if needed.

## Demo mode

Set `VITE_DEMO_MODE=true` to load demo parcels from `src/data/demo-parcelles.json`.

## Deployment

### Frontend (Vercel)

- Import the `frontend` folder.
- Build command: `npm run build`
- Output directory: `dist`
- Set env: `VITE_API_URL` pointing to Render backend.

### Backend (Render)

- Root: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Set env: `CORS_ORIGINS` with the Vercel URL.

## Notes

- AI model logic is stubbed in `backend/services/placeholders`.
- Voice flow: browser -> Whisper -> RAG stub -> gTTS (optional for now).
- Chat API is disabled unless `python-multipart` is installed.

## Optional chatbot dependencies

If you want the chatbot voice features later, install:

```
py -m pip install python-multipart openai-whisper==20231117 gTTS==2.5.1
```

You may also need `ffmpeg` in PATH for Whisper audio decoding.
