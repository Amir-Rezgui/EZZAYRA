from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field


class PolygonAnalyzeRequest(BaseModel):
    geojson: Dict[str, Any]
    zone_name: str = Field(default="")


class ParcelResult(BaseModel):
    id: str
    geometry: Dict[str, Any]
    classification: Literal["extensif", "intensif", "hyper-intensif"]
    ndvi_score: float
    anomaly_status: Literal["normal", "warning", "critical"]
    confidence: float


class AnalyzeResponse(BaseModel):
    job_id: str
    status: str
    parcelles: List[ParcelResult]


class ChatResponse(BaseModel):
    transcription: str
    response_text: str
    response_audio_url: str
    relevance_score: float
    refused: bool
    result_image_url: Optional[str] = None


class AnomalyResponse(BaseModel):
    parcel_id: str
    status: Literal["normal", "warning", "critical"]
    score: float
    history: List[float]
