"""
==========================================================
PLACEHOLDER - Classification oliveraies (Sentinel-2 + CNN)
==========================================================
This file is a STUB. Your teammate must:
1. Replace function `classify_parcel` with the real model
2. Keep the same signature and return format
3. Do not change imports or structure
==========================================================
"""

from typing import Any, Dict
import numpy as np


def classify_parcel(geojson_geometry: dict, ndvi_array: np.ndarray = None) -> Dict[str, Any]:
    """
    Classify an olive parcel.

    Args:
        geojson_geometry: GeoJSON geometry of the parcel
        ndvi_array: NDVI numpy array (optional)

    Returns:
        {
            "classification": "extensif" | "intensif" | "hyper-intensif",
            "confidence": float (0.0 - 1.0),
            "features": {
                "canopy_density": float,
                "tree_count_estimate": int,
                "avg_ndvi": float
            }
        }

    STUB: returns realistic simulated values for demo.
    Replace this with the real CNN model.
    """
    import random

    classifications = ["extensif", "intensif", "hyper-intensif"]
    chosen = random.choice(classifications)
    return {
        "classification": chosen,
        "confidence": round(random.uniform(0.75, 0.95), 2),
        "features": {
            "canopy_density": round(random.uniform(0.3, 0.8), 2),
            "tree_count_estimate": random.randint(50, 500),
            "avg_ndvi": round(random.uniform(0.4, 0.75), 2),
        },
    }
