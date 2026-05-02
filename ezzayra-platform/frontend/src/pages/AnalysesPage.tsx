import { useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Loader2,
  ChevronRight,
  TreePine,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

interface Analyse {
  id: string;
  zone: string;
  status: "termine" | "en cours" | "erreur";
  time: string;
  parcelles: number;
  classification: string;
  ndvi: number;
  anomaly: "normal" | "warning" | "critical";
}

const MOCK_ANALYSES: Analyse[] = [
  { id: "A-2451", zone: "Sfax Nord", status: "termine", time: "il y a 8 min", parcelles: 6, classification: "intensif", ndvi: 0.68, anomaly: "normal" },
  { id: "A-2450", zone: "Sidi Bouzid", status: "termine", time: "il y a 22 min", parcelles: 4, classification: "extensif", ndvi: 0.52, anomaly: "warning" },
  { id: "A-2449", zone: "Kairouan", status: "en cours", time: "il y a 1 h", parcelles: 8, classification: "hyper-intensif", ndvi: 0.71, anomaly: "normal" },
  { id: "A-2448", zone: "Kebili", status: "termine", time: "il y a 3 h", parcelles: 3, classification: "extensif", ndvi: 0.34, anomaly: "critical" },
  { id: "A-2447", zone: "Monastir", status: "termine", time: "il y a 5 h", parcelles: 7, classification: "intensif", ndvi: 0.61, anomaly: "normal" },
  { id: "A-2446", zone: "Sousse Est", status: "erreur", time: "il y a 6 h", parcelles: 0, classification: "—", ndvi: 0, anomaly: "normal" },
];

const STATUS_META = {
  termine: { label: "Terminé", icon: CheckCircle2, cls: "text-green-600 bg-green-50" },
  "en cours": { label: "En cours", icon: Loader2, cls: "text-olive-mid bg-olive-mid/10" },
  erreur: { label: "Erreur", icon: AlertTriangle, cls: "text-red-500 bg-red-50" },
};
const ANOMALY_TXT: Record<string, string> = { normal: "text-green-600", warning: "text-orange-500", critical: "text-red-500" };
const NDVI_BAR: Record<string, string> = { normal: "bg-green-500", warning: "bg-orange-400", critical: "bg-red-500" };

type FilterType = "tous" | "termine" | "en cours" | "erreur";

export default function AnalysesPage() {
  const [filter, setFilter] = useState<FilterType>("tous");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === "tous" ? MOCK_ANALYSES : MOCK_ANALYSES.filter((a) => a.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">Historique</p>
        <h2 className="mt-2 text-3xl">Analyses récentes</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          {MOCK_ANALYSES.length} analyses · {MOCK_ANALYSES.filter((a) => a.status === "termine").length} terminées
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["tous", "termine", "en cours", "erreur"] as FilterType[]).map((f) => (
            <button
              key={f} id={`filter-${f}`} onClick={() => setFilter(f)}
              className={clsx("rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition",
                filter === f ? "bg-olive-mid text-white shadow-olive" : "bg-white/80 text-olive-dark hover:bg-white"
              )}
            >
              {f === "tous" ? `Tous (${MOCK_ANALYSES.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${MOCK_ANALYSES.filter((a) => a.status === f).length})`}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3">
        {filtered.map((item) => {
          const s = STATUS_META[item.status];
          const StatusIcon = s.icon;
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className="overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-olive backdrop-blur">
              <button
                id={`analyse-row-${item.id}`}
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-olive-mid/15 text-olive-dark">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-olive-dark">{item.zone}</p>
                    <p className="text-xs text-olive-dark/60">{item.id} · {item.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx("hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold sm:flex", s.cls)}>
                    <StatusIcon size={12} className={item.status === "en cours" ? "animate-spin" : ""} />
                    {s.label}
                  </span>
                  <ChevronRight size={16} className={clsx("text-olive-dark/40 transition-transform", isOpen && "rotate-90")} />
                </div>
              </button>

              {isOpen && item.status === "termine" && (
                <div className="border-t border-olive-mid/10 px-5 pb-5 pt-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl bg-olive-mid/8 p-3">
                      <div className="flex items-center gap-1 text-xs text-olive-dark/60"><TreePine size={12} /> Parcelles</div>
                      <p className="mt-1 text-xl font-bold text-olive-dark">{item.parcelles}</p>
                    </div>
                    <div className="rounded-2xl bg-olive-mid/8 p-3">
                      <p className="text-xs text-olive-dark/60">Classification</p>
                      <p className="mt-1 text-sm font-bold capitalize text-olive-dark">{item.classification}</p>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-olive-mid/8 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-olive-dark/60">Score NDVI moyen</p>
                        <p className={clsx("text-xs font-bold", ANOMALY_TXT[item.anomaly])}>{item.ndvi.toFixed(2)}</p>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-olive-mid/15">
                        <div className={clsx("h-full rounded-full", NDVI_BAR[item.anomaly])} style={{ width: `${item.ndvi * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {isOpen && item.status === "erreur" && (
                <div className="border-t border-red-100 px-5 pb-5 pt-4">
                  <p className="text-sm text-red-500">L'analyse a échoué. Vérifiez la connexion au backend et relancez.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
