# Placeholders - How to plug real models

All files in this folder are STUBS used for the demo. Replace the function body only.

## classification_stub.py

Signature:

- `classify_parcel(geojson_geometry: dict, ndvi_array: np.ndarray = None) -> Dict[str, Any]`

Return format:

```
{
  "classification": "extensif" | "intensif" | "hyper-intensif",
  "confidence": 0.0-1.0,
  "features": {
    "canopy_density": float,
    "tree_count_estimate": int,
    "avg_ndvi": float
  }
}
```

## segmentation_stub.py

Signature:

- `segment_zone(geojson_polygon: dict) -> Dict[str, Any]`

Return format:

```
{
  "parcelles": [GeoJSON polygons],
  "ndvi_arrays": [np.ndarray]
}
```

## anomaly_stub.py

Signature:

- `detect_anomaly(parcel_id: str, ndvi_series: list) -> Dict[str, Any]`

Return format:

```
{
  "status": "normal|warning|critical",
  "score": float,
  "history": [12 floats]
}
```

## rag_stub.py

Signature:

- `query_corpus(question: str, image_analysis: dict = None) -> Dict[str, Any]`

Return format:

```
{
  "answer": "...",
  "sources": [...],
  "relevance_score": 0.0-1.0
}
```

## Quick test

1. Start backend
2. Call `/api/analyze/polygon` and check GeoJSON export
3. Call `/api/chat/voice` with any audio file
