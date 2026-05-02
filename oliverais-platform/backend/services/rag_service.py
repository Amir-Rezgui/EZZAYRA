from typing import Any, Dict, Optional

from services.placeholders.rag_stub import query_corpus


class RagService:
    def query(self, question: str, image_analysis: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return query_corpus(question, image_analysis=image_analysis)


rag_service = RagService()
