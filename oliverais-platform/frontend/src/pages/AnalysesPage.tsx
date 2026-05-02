import { ClipboardList } from "lucide-react";

const items = [
  {
    id: "A-2451",
    zone: "Sfax Nord",
    status: "termine",
    time: "il y a 8 min"
  },
  {
    id: "A-2450",
    zone: "Sidi Bouzid",
    status: "termine",
    time: "il y a 22 min"
  },
  {
    id: "A-2449",
    zone: "Kairouan",
    status: "en cours",
    time: "il y a 1 h"
  }
];

export default function AnalysesPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">
          Historique
        </p>
        <h2 className="mt-2 text-3xl">Analyses recentes</h2>
      </section>

      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-olive-mid/15 text-olive-dark">
                <ClipboardList size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-olive-dark">
                  {item.zone}
                </p>
                <p className="text-xs text-olive-dark/70">{item.id}</p>
              </div>
            </div>
            <div className="text-right text-xs text-olive-dark/70">
              <p className="font-semibold text-olive-dark">{item.status}</p>
              <p>{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
