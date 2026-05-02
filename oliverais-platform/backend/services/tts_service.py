import time
import uuid
from pathlib import Path

try:
    from gtts import gTTS
except Exception:
    gTTS = None


class TTSService:
    def __init__(self):
        self.audio_dir = Path("static/audio")
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    def synthesize(self, text: str, lang: str = "ar") -> str:
        if not text or gTTS is None:
            return ""
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.mp3"
        path = self.audio_dir / filename
        tts = gTTS(text=text, lang=lang)
        tts.save(str(path))
        self._cleanup_old_files()
        return f"/static/audio/{filename}"

    def _cleanup_old_files(self, max_age_seconds: int = 3600) -> None:
        now = time.time()
        for file_path in self.audio_dir.glob("*.mp3"):
            try:
                if now - file_path.stat().st_mtime > max_age_seconds:
                    file_path.unlink()
            except OSError:
                continue


tts_service = TTSService()
