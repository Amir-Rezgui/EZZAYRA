import { useEffect, useRef, useState } from "react";

export type AudioRecorderState = "idle" | "recording" | "stopped";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, ext: string) => void;
  onStateChange?: (state: AudioRecorderState) => void;
}

export function AudioRecorder({
  onRecordingComplete,
  onStateChange,
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<AudioRecorderState>("idle");

  const updateState = (s: AudioRecorderState) => {
    setState(s);
    onStateChange?.(s);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());
        onRecordingComplete(blob, "webm");
        updateState("stopped");
      };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      updateState("recording");
    } catch (err) {
      console.error("AudioRecorder: microphone access denied", err);
    }
  };

  const stop = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // Expose imperative API via a custom event — parent calls via ref
  useEffect(() => {
    const el = document.getElementById("audio-recorder-ctrl");
    if (!el) return;
    const handleStart = () => start();
    const handleStop = () => stop();
    el.addEventListener("recorder:start", handleStart);
    el.addEventListener("recorder:stop", handleStop);
    return () => {
      el.removeEventListener("recorder:start", handleStart);
      el.removeEventListener("recorder:stop", handleStop);
    };
  });

  return (
    <span
      id="audio-recorder-ctrl"
      data-state={state}
      style={{ display: "none" }}
    />
  );
}
