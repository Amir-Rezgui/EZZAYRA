import os
import tempfile

try:
    import whisper
except Exception:
    whisper = None


class WhisperService:
    def __init__(self):
        self.available = whisper is not None
        self.model = None
        if self.available:
            model_name = os.getenv("WHISPER_MODEL", "small")
            self.model = whisper.load_model(model_name)

    def transcribe(self, audio_bytes: bytes, ext: str = "wav") -> dict:
        if not self.available or self.model is None:
            return {
                "text": "",
                "language": self.get_language_hint(),
                "segments": [],
            }
        suffix = f".{ext}" if ext else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            result = self.model.transcribe(
                tmp_path,
                language=self.get_language_hint(),
                fp16=False,
            )
            return {
                "text": (result.get("text") or "").strip(),
                "language": result.get("language", self.get_language_hint()),
                "segments": result.get("segments", []),
            }
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    def get_language_hint(self) -> str:
        return "ar"


whisper_service = WhisperService()
