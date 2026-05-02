import json

from fastapi import APIRouter, HTTPException, Response

from services.job_store import get_job

router = APIRouter()


@router.get("/geojson/{job_id}")
def export_geojson(job_id: str) -> Response:
    geojson = get_job(job_id)
    if not geojson:
        raise HTTPException(status_code=404, detail="job not found")

    content = json.dumps(geojson)
    headers = {
        "Content-Disposition": f"attachment; filename=\"ezzayra_{job_id}.geojson\""
    }
    return Response(content=content, media_type="application/geo+json", headers=headers)
