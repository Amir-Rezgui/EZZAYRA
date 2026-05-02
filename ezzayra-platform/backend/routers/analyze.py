import uuid
from typing import List

from fastapi import APIRouter

from models.schemas import AnalyzeResponse, ParcelResult, PolygonAnalyzeRequest
from services.job_store import save_job
from services.placeholders.anomaly_stub import detect_anomaly
from services.placeholders.classification_stub import classify_parcel
from services.placeholders.segmentation_stub import segment_zone

router = APIRouter()


@router.post("/polygon", response_model=AnalyzeResponse)
def analyze_polygon(payload: PolygonAnalyzeRequest) -> AnalyzeResponse:
    job_id = str(uuid.uuid4())
    segment_result = segment_zone(payload.geojson)
    parcels: List[ParcelResult] = []
    features = []

    parcelles = segment_result.get("parcelles", [])
    ndvi_arrays = segment_result.get("ndvi_arrays", [])

    for index, geometry in enumerate(parcelles):
        ndvi_array = ndvi_arrays[index] if index < len(ndvi_arrays) else None
        classification = classify_parcel(geometry, ndvi_array)
        parcel_id = str(uuid.uuid4())

        ndvi_score = float(classification.get("features", {}).get("avg_ndvi", 0.6))
        anomaly = detect_anomaly(parcel_id, None)

        parcel = ParcelResult(
            id=parcel_id,
            geometry=geometry,
            classification=classification["classification"],
            ndvi_score=ndvi_score,
            anomaly_status=anomaly["status"],
            confidence=classification["confidence"],
        )
        parcels.append(parcel)

        features.append(
            {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "id": parcel_id,
                    "classification": classification["classification"],
                    "ndvi_score": ndvi_score,
                    "anomaly_status": anomaly["status"],
                    "confidence": classification["confidence"],
                },
            }
        )

    geojson = {"type": "FeatureCollection", "features": features}
    save_job(job_id, geojson)

    return AnalyzeResponse(job_id=job_id, status="completed", parcelles=parcels)
