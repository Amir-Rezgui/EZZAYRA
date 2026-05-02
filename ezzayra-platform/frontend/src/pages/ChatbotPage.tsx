import { VoiceChatbot } from "../components/VoiceChatbot";

export default function ChatbotPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">
          Assistant vocal
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl">Chatbot EZZAYRA</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          Posez vos questions en darija, joignez une photo, et recevez une
          reponse vocale (ou texte en arabe tunisien si la voix ne marche pas).
        </p>
      </section>
      <VoiceChatbot />
    </div>
  );
}
