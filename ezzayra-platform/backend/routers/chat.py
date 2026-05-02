import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import ChatResponse
from services.placeholders.classification_stub import classify_parcel
from services.rag_service import rag_service
from services.tts_service import tts_service
from services.whisper_service import whisper_service

router = APIRouter()

REFUSAL_MESSAGE = "Aasif, ma 3andich ma3louma kefaya f'had el mawdou3"


@router.post("/voice", response_model=ChatResponse)
async def voice_chat(
    audio: UploadFile = File(...),
    image: Optional[UploadFile] = File(None),
) -> ChatResponse:
    if not audio:
        raise HTTPException(status_code=400, detail="audio file required")

    audio_bytes = await audio.read()
    ext = "wav"
    if audio.filename and "." in audio.filename:
        ext = audio.filename.rsplit(".", 1)[1].lower()

    transcription_result = whisper_service.transcribe(audio_bytes, ext=ext)
    transcription = transcription_result.get("text", "").strip()

    image_url = None
    image_analysis = None
    if image:
        uploads_dir = Path("static/uploads")
        uploads_dir.mkdir(parents=True, exist_ok=True)
        image_ext = "jpg"
        if image.filename and "." in image.filename:
            image_ext = image.filename.rsplit(".", 1)[1].lower()
        image_name = f"{uuid.uuid4()}.{image_ext}"
        image_path = uploads_dir / image_name
        image_bytes = await image.read()
        image_path.write_bytes(image_bytes)
        image_url = f"/static/uploads/{image_name}"
        image_analysis = classify_parcel({"type": "Point", "coordinates": [0, 0]})

    rag_result = rag_service.query(transcription or " ", image_analysis=image_analysis)
    relevance = float(rag_result.get("relevance_score", 0.0))
    threshold = float(os.getenv("RELEVANCE_THRESHOLD", "0.35"))

    if relevance < threshold:
        response_text = REFUSAL_MESSAGE
        refused = True
    else:
        response_text = rag_result.get("answer", "")
        refused = False

    response_audio_url = tts_service.synthesize(
        response_text,
        lang=os.getenv("TTS_LANG", "ar"),
    )

    return ChatResponse(
        transcription=transcription,
        response_text=response_text,
        response_audio_url=response_audio_url,
        relevance_score=relevance,
        refused=refused,
        result_image_url=image_url,
    )
