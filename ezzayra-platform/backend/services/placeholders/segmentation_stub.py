"""
PLACEHOLDER - Segmentation oliveraies from Sentinel-2
Function signature:
    segment_zone(geojson_polygon: dict) -> Dict[str, Any]
Return:
    { "parcelles": [GeoJSON polygons], "ndvi_arrays": [np.ndarray] }
"""

from typing import Any, Dict, List
import random

import numpy as np


def _extract_center(geojson_polygon: dict) -> List[float]:
    try:
        if geojson_polygon.get("type") == "FeatureCollection":
            geojson_polygon = geojson_polygon.get("features", [])[0].get("geometry", {})
        if geojson_polygon.get("type") == "Feature":
            geojson_polygon = geojson_polygon.get("geometry", {})
        coords = geojson_polygon.get("coordinates", [])
        ring = coords[0]
        lons = [pt[0] for pt in ring]
        lats = [pt[1] for pt in ring]
        return [sum(lons) / len(lons), sum(lats) / len(lats)]
    except Exception:
        return [10.7, 34.7]


def segment_zone(geojson_polygon: dict) -> Dict[str, Any]:
    center = _extract_center(geojson_polygon)
    parcelles = []
    ndvi_arrays = []

    for _ in range(random.randint(4, 7)):
        offset_x = random.uniform(-0.01, 0.01)
        offset_y = random.uniform(-0.01, 0.01)
        size = random.uniform(0.002, 0.006)
        lng = center[0] + offset_x
        lat = center[1] + offset_y
        polygon = {
            "type": "Polygon",
            "coordinates": [
                [
                    [lng - size, lat - size],
                    [lng + size, lat - size],
                    [lng + size, lat + size],
                    [lng - size, lat + size],
                    [lng - size, lat - size],
                ]
            ],
        }
        parcelles.append(polygon)
        ndvi_arrays.append(np.random.uniform(0.3, 0.8, size=(16, 16)))

    return {"parcelles": parcelles, "ndvi_arrays": ndvi_arrays}
