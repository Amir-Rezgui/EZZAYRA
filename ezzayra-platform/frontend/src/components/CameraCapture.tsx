import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClear?: () => void;
  preview?: string | null;
}

export function CameraCapture({ onCapture, onClear, preview }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayed = preview ?? localPreview;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onCapture(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleClear = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onClear?.();
  };

  return (
    <div className="relative">
      {displayed ? (
        <div className="relative inline-block">
          <img
            src={displayed}
            alt="Capture"
            className="h-20 w-20 rounded-2xl object-cover shadow-olive"
          />
          <button
            id="camera-clear-btn"
            onClick={handleClear}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-olive-dark text-white shadow"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          id="camera-capture-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-olive-mid/30 bg-white/70 text-olive-dark shadow-olive transition hover:bg-olive-mid/10"
          title="Joindre une photo"
        >
          <Camera size={20} />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
