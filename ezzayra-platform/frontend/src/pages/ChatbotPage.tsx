export default function ChatbotPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-3xl border border-white/70 shadow-olive">
      <iframe 
        src="/voice-agent.html" 
        className="h-full w-full border-0 bg-transparent"
        allow="microphone; camera"
        title="Voice Agent"
      />
    </div>
  );
}
