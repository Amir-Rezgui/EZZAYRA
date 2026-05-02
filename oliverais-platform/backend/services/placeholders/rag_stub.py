"""
PLACEHOLDER - RAG over PDF corpus (FAO, EPPO, CIHEAM)
Function signature:
    query_corpus(question: str, image_analysis: dict = None) -> Dict[str, Any]
Return:
    { "answer": str, "sources": [...], "relevance_score": float }
"""

from typing import Any, Dict, Optional
import random


def query_corpus(question: str, image_analysis: Optional[dict] = None) -> Dict[str, Any]:
    relevance = round(random.uniform(0.2, 0.95), 2)
    answer = (
        "Conseils generaux: surveillez l'irrigation, elaguez en hiver, "
        "et suivez l'evolution NDVI pour detecter les anomalies."
    )
    sources = [
        {"title": "FAO Olive Guide", "page": 12},
        {"title": "CIHEAM Olive Notes", "page": 5},
    ]
    return {"answer": answer, "sources": sources, "relevance_score": relevance}
