import { useEffect, useRef } from "react";

export default function ChatbotPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.location.replace("/voice-agent.html");
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-3xl border border-white/70 shadow-olive">
      <iframe 
        ref={iframeRef}
        className="h-full w-full border-0 bg-transparent"
        allow="microphone; camera"
        title="Voice Agent"
      />
    </div>
  );
}
