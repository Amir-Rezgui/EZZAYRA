from fastapi import APIRouter

from models.schemas import AnomalyResponse
from services.placeholders.anomaly_stub import detect_anomaly

router = APIRouter()


@router.get("/{parcel_id}", response_model=AnomalyResponse)
def get_anomaly(parcel_id: str) -> AnomalyResponse:
    result = detect_anomaly(parcel_id, None)
    return AnomalyResponse(
        parcel_id=parcel_id,
        status=result["status"],
        score=result["score"],
        history=result["history"],
    )
