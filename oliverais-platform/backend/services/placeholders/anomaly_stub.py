"""
PLACEHOLDER - NDVI anomaly detection
Function signature:
    detect_anomaly(parcel_id: str, ndvi_series: list) -> Dict[str, Any]
Return:
    { "status": "normal|warning|critical", "score": float, "history": [...] }
"""

from typing import Any, Dict, List
import random


def detect_anomaly(parcel_id: str, ndvi_series: List[float] = None) -> Dict[str, Any]:
    if not ndvi_series:
        base = random.uniform(0.4, 0.7)
        ndvi_series = [
            round(max(0.1, min(0.9, base + random.uniform(-0.15, 0.15))), 2)
            for _ in range(12)
        ]

    score = round(1 - min(ndvi_series), 2)
    if score < 0.35:
        status = "normal"
    elif score < 0.6:
        status = "warning"
    else:
        status = "critical"

    return {"status": status, "score": score, "history": ndvi_series}
