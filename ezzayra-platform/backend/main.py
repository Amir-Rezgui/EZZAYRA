import os
from importlib.util import find_spec

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import analyze, anomaly, export

load_dotenv()

app = FastAPI(title="EZZAYRA API", version="1.0.0")

origins_env = os.getenv("CORS_ORIGINS", "*")
if origins_env == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(analyze.router, prefix="/api/analyze")
if find_spec("multipart") is not None:
    from routers import chat

    app.include_router(chat.router, prefix="/api/chat")
else:
    print("Chat router disabled: python-multipart not installed.")
app.include_router(anomaly.router, prefix="/api/anomaly")
app.include_router(export.router, prefix="/api/export")


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
