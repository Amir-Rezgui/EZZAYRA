import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mic2 } from "lucide-react";

import { api } from "../services/api";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useCamera } from "../hooks/useCamera";

type ChatStatus = "idle" | "recording" | "processing" | "responding" | "refused";

type ChatMessage = {
  id: string;
  type: "user" | "assistant" | "refused";
  transcription?: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string | null;
  timestamp: Date;
};

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatAudioUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
};

const AUDIO_FALLBACK_PREFIX = "الصوت موش خدام توا. هذا هو الجواب مكتوب:";

const buildFallbackText = (text: string) =>
  text ? `${AUDIO_FALLBACK_PREFIX}\n${text}` : AUDIO_FALLBACK_PREFIX;

const speakText = (text: string, onError?: () => void) => {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-TN";
  if (onError) utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
  return true;
};

export function VoiceChatbot() {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastBlobRef = useRef<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { isRecording, audioBlob, error: audioError, start, stop } =
    useAudioRecorder();
  const {
    isActive: cameraActive,
    error: cameraError,
    videoRef,
    start: startCamera,
    stop: stopCamera,
    capture
  } = useCamera();

  useEffect(() => {
    if (audioError) setError(audioError);
  }, [audioError]);

  useEffect(() => {
    if (cameraError) setError(cameraError);
  }, [cameraError]);

  useEffect(() => {
    if (!audioBlob || status !== "processing") return;
    if (lastBlobRef.current === audioBlob) return;
    lastBlobRef.current = audioBlob;

    const send = async () => {
      setError(null);
      try {
        const response = await api.sendVoiceMessage(audioBlob, imageFile ?? undefined);
        const userMessage: ChatMessage = {
          id: `${Date.now()}-user`,
          type: "user",
          transcription: response.transcription,
          text: response.transcription || "Message vocal",
          timestamp: new Date()
        };
        const assistantType = response.refused ? "refused" : "assistant";
        const assistantId = `${Date.now()}-assistant`;
        const assistantMessage: ChatMessage = {
          id: assistantId,
          type: assistantType,
          text: response.response_text,
          audioUrl: response.response_audio_url,
          imageUrl: response.result_image_url ?? null,
          timestamp: new Date()
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setStatus(response.refused ? "refused" : "responding");

        const applyFallback = () =>
          applyFallbackText(assistantId, response.response_text);
        const audioUrl = formatAudioUrl(response.response_audio_url);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play().catch(() => {
            const spoken = speakText(response.response_text, applyFallback);
            if (!spoken) applyFallback();
          });
        } else {
          const spoken = speakText(response.response_text, applyFallback);
          if (!spoken) applyFallback();
        }
      } catch (err) {
        setError((err as Error).message || "Erreur lors de l'envoi");
        setStatus("idle");
      }
    };

    send();
  }, [audioBlob, imageFile, status]);

  const handleToggleRecording = async () => {
    if (status === "processing") return;
    if (isRecording) {
      stop();
      setStatus("processing");
      return;
    }
    setStatus("recording");
    await start();
  };

  const applyFallbackText = (messageId: string, responseText: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId
          ? { ...message, text: buildFallbackText(responseText) }
          : message
      )
    );
  };

  const setPreviewFromFile = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
    setImageFile(file);
  };

  const handleCapturePhoto = async () => {
    if (!cameraActive) {
      await startCamera();
      return;
    }
    const file = await capture();
    if (file) setPreviewFromFile(file);
    stopCamera();
  };

  const handleSelectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewFromFile(file);
    if (cameraActive) stopCamera();
    event.target.value = "";
  };

  const handleClearImage = () => {
    setPreviewFromFile(null);
  };

  const statusLabel = useMemo(() => {
    switch (status) {
      case "recording":
        return "Enregistrement...";
      case "processing":
        return "Traitement en cours";
      case "responding":
        return "Reponse envoyee";
      case "refused":
        return "Reponse refusee";
      default:
        return "Pret a enregistrer";
    }
  }, [status]);

  const isBusy = status === "processing";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <div className="flex flex-col items-center gap-6 text-center">
          <button
            className={
              "flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full text-white shadow-olive transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive-light/70 sm:h-52 sm:w-52 " +
              (isRecording ? "bg-olive-dark pulse-soft" : "bg-olive-mid hover:bg-olive-dark") +
              (isBusy ? " opacity-70" : "")
            }
            onClick={handleToggleRecording}
            aria-label={isRecording ? "Arreter l'enregistrement" : "Commencer l'enregistrement"}
            aria-pressed={isRecording}
            disabled={!isRecording && isBusy}
            type="button"
          >
            <Mic2 size={56} />
            <span className="text-base font-semibold sm:text-lg">
              {isRecording ? "Arreter" : "Parler"}
            </span>
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-olive-dark/70">
              Commande vocale
            </p>
            <p className="mt-2 text-2xl font-semibold text-olive-dark sm:text-3xl">
              اضغط وتكلم
            </p>
            <p className="mt-3 text-base text-olive-dark/80 sm:text-lg">
              Appuyez une fois pour parler, appuyez encore pour envoyer.
            </p>
            <p
              className="mt-3 text-sm font-semibold text-olive-dark/70"
              role="status"
              aria-live="polite"
            >
              {statusLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-end gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className="wave-bar"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              className="flex items-center gap-2 rounded-2xl border border-olive-mid/40 bg-white px-4 py-2 text-sm font-semibold text-olive-dark"
              onClick={handleCapturePhoto}
            >
              <Camera size={18} />
              {cameraActive ? "Capturer" : "Camera"}
            </button>
            <button
              className="rounded-2xl bg-olive-mid/10 px-4 py-2 text-sm font-semibold text-olive-dark"
              onClick={() => fileInputRef.current?.click()}
            >
              Importer photo
            </button>
            {imagePreview && (
              <button
                className="rounded-2xl bg-olive-mid/10 px-4 py-2 text-sm font-semibold text-olive-dark"
                onClick={handleClearImage}
              >
                Retirer photo
              </button>
            )}
          </div>

          {cameraActive && (
            <div className="w-full overflow-hidden rounded-2xl border border-white/80">
              <video ref={videoRef} className="h-48 w-full object-cover" />
            </div>
          )}

          {imagePreview && (
            <div className="w-full overflow-hidden rounded-2xl border border-white/80">
              <img
                src={imagePreview}
                alt="Capture"
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelectImage}
          />

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-sm font-semibold text-olive-dark">Historique</p>
        <div className="mt-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-olive-mid/40 bg-white/70 p-4 text-olive-dark/70">
              Aucun message pour le moment. Enregistrez une question en darija.
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                "rounded-2xl p-4 " +
                (message.type === "user"
                  ? "bg-white/90 text-olive-dark"
                  : message.type === "refused"
                  ? "bg-red-50 text-red-700"
                  : "bg-olive-mid/10 text-olive-dark")
              }
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                {message.type === "user" ? "Agriculteur" : "Assistant"}
              </p>
              <p className="mt-2 whitespace-pre-line break-words">
                {message.text}
              </p>
              {message.audioUrl && (
                <audio
                  className="mt-3 w-full"
                  controls
                  src={formatAudioUrl(message.audioUrl)}
                />
              )}
              {message.imageUrl && (
                <img
                  src={formatAudioUrl(message.imageUrl)}
                  alt="Resultat"
                  className="mt-3 h-40 w-full rounded-xl object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
