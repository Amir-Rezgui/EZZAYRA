from typing import Any, Dict, Optional

JOB_STORE: Dict[str, Dict[str, Any]] = {}


def save_job(job_id: str, geojson: Dict[str, Any]) -> None:
    JOB_STORE[job_id] = geojson


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    return JOB_STORE.get(job_id)
