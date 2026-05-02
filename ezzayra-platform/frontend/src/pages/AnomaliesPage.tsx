import { useState } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Map as MapIcon } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import clsx from "clsx";

import { AnomalyZoneMap } from "../components/AnomalyZoneMap";
import { ANOMALY_ZONES } from "../data/anomaly-zones";

// ── static parcel list (NDVI cards) ─────────────────────────────────────────
interface AnomalyParcel {
  id: string;
  zone: string;
  status: "normal" | "warning" | "critical";
  ndvi: number;
  trend: "up" | "down" | "stable";
  history: { month: string; ndvi: number }[];
}

const PARCELS: AnomalyParcel[] = [
  {
    id: "P-102", zone: "Sfax Sud", status: "warning", ndvi: 0.42, trend: "down",
    history: [
      { month: "Jun", ndvi: 0.61 }, { month: "Jul", ndvi: 0.58 }, { month: "Aoû", ndvi: 0.55 },
      { month: "Sep", ndvi: 0.53 }, { month: "Oct", ndvi: 0.50 }, { month: "Nov", ndvi: 0.49 },
      { month: "Déc", ndvi: 0.47 }, { month: "Jan", ndvi: 0.46 }, { month: "Fév", ndvi: 0.45 },
      { month: "Mar", ndvi: 0.44 }, { month: "Avr", ndvi: 0.43 }, { month: "Mai", ndvi: 0.42 },
    ],
  },
  {
    id: "P-118", zone: "Kebili", status: "critical", ndvi: 0.31, trend: "down",
    history: [
      { month: "Jun", ndvi: 0.59 }, { month: "Jul", ndvi: 0.54 }, { month: "Aoû", ndvi: 0.48 },
      { month: "Sep", ndvi: 0.44 }, { month: "Oct", ndvi: 0.41 }, { month: "Nov", ndvi: 0.39 },
      { month: "Déc", ndvi: 0.37 }, { month: "Jan", ndvi: 0.36 }, { month: "Fév", ndvi: 0.35 },
      { month: "Mar", ndvi: 0.34 }, { month: "Avr", ndvi: 0.32 }, { month: "Mai", ndvi: 0.31 },
    ],
  },
  {
    id: "P-099", zone: "Monastir", status: "warning", ndvi: 0.46, trend: "stable",
    history: [
      { month: "Jun", ndvi: 0.48 }, { month: "Jul", ndvi: 0.47 }, { month: "Aoû", ndvi: 0.46 },
      { month: "Sep", ndvi: 0.47 }, { month: "Oct", ndvi: 0.46 }, { month: "Nov", ndvi: 0.45 },
      { month: "Déc", ndvi: 0.46 }, { month: "Jan", ndvi: 0.47 }, { month: "Fév", ndvi: 0.46 },
      { month: "Mar", ndvi: 0.46 }, { month: "Avr", ndvi: 0.47 }, { month: "Mai", ndvi: 0.46 },
    ],
  },
  {
    id: "P-077", zone: "Nabeul", status: "normal", ndvi: 0.67, trend: "up",
    history: [
      { month: "Jun", ndvi: 0.60 }, { month: "Jul", ndvi: 0.61 }, { month: "Aoû", ndvi: 0.62 },
      { month: "Sep", ndvi: 0.63 }, { month: "Oct", ndvi: 0.64 }, { month: "Nov", ndvi: 0.64 },
      { month: "Déc", ndvi: 0.65 }, { month: "Jan", ndvi: 0.65 }, { month: "Fév", ndvi: 0.66 },
      { month: "Mar", ndvi: 0.66 }, { month: "Avr", ndvi: 0.67 }, { month: "Mai", ndvi: 0.67 },
    ],
  },
];

const STATUS_META = {
  normal:   { label: "Normal",   cls: "text-green-600  bg-green-50",  bar: "#22c55e" },
  warning:  { label: "Attention", cls: "text-orange-500 bg-orange-50", bar: "#f97316" },
  critical: { label: "Critique", cls: "text-red-500    bg-red-50",    bar: "#ef4444" },
};

const TREND_ICON = {
  up:     <TrendingUp  size={14} className="text-green-500" />,
  down:   <TrendingDown size={14} className="text-red-500"   />,
  stable: <Minus        size={14} className="text-olive-mid"  />,
};

// ── view toggle ───────────────────────────────────────────────────────────────
type View = "list" | "map";

export default function AnomaliesPage() {
  const [view, setView]     = useState<View>("map");
  const [selected, setSelected] = useState<string>(PARCELS[0].id);
  const parcel = PARCELS.find((p) => p.id === selected)!;
  const s = STATUS_META[parcel.status];

  const criticalCount = PARCELS.filter((p) => p.status === "critical").length;
  const warningCount  = PARCELS.filter((p) => p.status === "warning").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">Surveillance NDVI</p>
        <h2 className="mt-2 text-3xl">Anomalies détectées</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          Suivez les parcelles avec risque hydrique ou maladie. Explorez la carte interactive pour
          visualiser les zones à risque.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {/* Badge counts */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-600">
                {criticalCount} critique{criticalCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-xs font-semibold text-orange-500">
                {warningCount} en attention
              </span>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-2 rounded-2xl border border-white/70 bg-white/60 p-1">
            <button
              id="anomalies-view-map"
              onClick={() => setView("map")}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition",
                view === "map"
                  ? "bg-olive-mid text-white shadow-olive"
                  : "text-olive-dark hover:bg-white"
              )}
            >
              <MapIcon size={14} />
              Carte des zones
            </button>
            <button
              id="anomalies-view-list"
              onClick={() => setView("list")}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition",
                view === "list"
                  ? "bg-olive-mid text-white shadow-olive"
                  : "text-olive-dark hover:bg-white"
              )}
            >
              <AlertTriangle size={14} />
              Analyse NDVI
            </button>
          </div>
        </div>
      </section>

      {/* ── Map view ── */}
      {view === "map" && (
        <div className="flex flex-col gap-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { color: "#ef4444", label: "Critique" },
              { color: "#f97316", label: "Attention" },
              { color: "#22c55e", label: "Normal" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  style={{ background: color, width: 12, height: 12, borderRadius: 3, display: "inline-block" }}
                />
                <span className="text-xs text-olive-dark/70">{label}</span>
              </div>
            ))}
            <span className="text-xs text-olive-dark/50 ml-2 italic">
              Survolez un polygone pour voir les alertes · Cliquez pour analyser la zone
            </span>
          </div>

          {/* Map container */}
          <div
            className="overflow-hidden rounded-3xl border border-white/70 shadow-olive"
            style={{ minHeight: 500 }}
          >
            <AnomalyZoneMap zones={ANOMALY_ZONES} />
          </div>
        </div>
      )}

      {/* ── List / NDVI view ── */}
      {view === "list" && (
        <>
          {/* Parcel selector */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {PARCELS.map((p) => {
              const m = STATUS_META[p.status];
              return (
                <button
                  key={p.id}
                  id={`parcel-btn-${p.id}`}
                  onClick={() => setSelected(p.id)}
                  className={clsx(
                    "flex min-w-[140px] flex-col gap-1 rounded-2xl border p-4 text-left transition",
                    selected === p.id
                      ? "border-olive-mid bg-white shadow-olive"
                      : "border-white/70 bg-white/60 hover:bg-white"
                  )}
                >
                  <span className={clsx("self-start rounded-full px-2 py-0.5 text-[10px] font-bold", m.cls)}>
                    {m.label}
                  </span>
                  <p className="text-sm font-semibold text-olive-dark">{p.zone}</p>
                  <p className="text-xs text-olive-dark/60">{p.id} · NDVI {p.ndvi.toFixed(2)}</p>
                </button>
              );
            })}
          </div>

          {/* Chart card */}
          <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/60">{parcel.id}</p>
                <h3 className="mt-1 text-xl font-bold text-olive-dark">{parcel.zone}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>
                <span className="flex items-center gap-1 text-xs text-olive-dark/60">
                  {TREND_ICON[parcel.trend]}
                  Tendance {parcel.trend === "up" ? "haussière" : parcel.trend === "down" ? "baissière" : "stable"}
                </span>
              </div>
            </div>

            {/* NDVI progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-olive-dark/60">
                <span>NDVI actuel</span>
                <span className="font-bold text-olive-dark">{parcel.ndvi.toFixed(2)}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-olive-mid/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${parcel.ndvi * 100}%`, backgroundColor: s.bar }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-olive-dark/40">
                <span>0.0 — Sec</span>
                <span className="text-orange-400">0.4 — Seuil</span>
                <span>1.0 — Sain</span>
              </div>
            </div>

            {/* Recharts area chart */}
            <p className="mb-2 text-xs font-semibold text-olive-dark/60">Historique NDVI — 12 mois</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={parcel.history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={s.bar} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={s.bar} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d4a1e10" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#2d4a1e80" }} />
                <YAxis domain={[0.2, 0.8]} tick={{ fontSize: 10, fill: "#2d4a1e80" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #2d4a1e20", fontSize: 12 }}
                  formatter={(v: number) => [v.toFixed(2), "NDVI"]}
                />
                <Area
                  type="monotone"
                  dataKey="ndvi"
                  stroke={s.bar}
                  strokeWidth={2}
                  fill="url(#ndviGrad)"
                  dot={{ r: 3, fill: s.bar }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
