import { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Minus,
  Map as MapIcon, RefreshCw, Clock, Wifi, WifiOff,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import clsx from "clsx";

import { AnomalyZoneMap } from "../components/AnomalyZoneMap";
import { useAnomalyData, type AnomalyResult } from "../services/anomalyService";
import type { AnomalyZone } from "../data/anomaly-zones";

// ── Status meta ───────────────────────────────────────────────────────────────
const STATUS_META = {
  normal:   { label: "Normal",   cls: "text-green-600  bg-green-50",  bar: "#22c55e" },
  warning:  { label: "Attention", cls: "text-orange-500 bg-orange-50", bar: "#f97316" },
  critical: { label: "Critique", cls: "text-red-500    bg-red-50",    bar: "#ef4444" },
};

const TREND_ICON = {
  up:     <TrendingUp  size={14} className="text-green-500" />,
  down:   <TrendingDown size={14} className="text-red-500"  />,
  stable: <Minus        size={14} className="text-olive-mid" />,
};

function getTrend(history: AnomalyResult["history"]) {
  if (history.length < 2) return "stable" as const;
  const first = history[0].observe;
  const last  = history[history.length - 1].observe;
  const diff  = last - first;
  if (diff > 0.02)  return "up"     as const;
  if (diff < -0.02) return "down"   as const;
  return "stable" as const;
}

// ── Map ANOMALY_ZONES from real results ───────────────────────────────────────
function resultsToZones(results: AnomalyResult[]): AnomalyZone[] {
  return results.map((r) => ({
    id:   r.id,
    name: r.name,
    status: r.status,
    coordinates: r.polygone.map((p) => [p.lng, p.lat] as [number, number]),
    alerts: r.status !== "normal"
      ? [{
          id: `${r.id}-alert`,
          severity: r.status === "critical" ? "critical" : "warning",
          message: r.explication,
          timestamp: new Date().toISOString(),
        } as const]
      : [],
    analyses: r.history.map((h, i) => ({
      id:           `${r.id}-h${i}`,
      date:         h.label,
      ndvi:         h.observe,
      humidity:     0,
      temperature:  r.lst_observe[i] ?? 0,
      disease_risk: r.status === "critical" ? "high" : r.status === "warning" ? "medium" : "low",
      notes:        r.recommandation,
    } as const)),
    history: r.history,
  }));
}

// ── Countdown display ─────────────────────────────────────────────────────────
function NextRefreshBadge({ lastUpdated }: { lastUpdated: Date | null }) {
  const [remaining, setRemaining] = useState(300);
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setRemaining(Math.max(0, 300 - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <span className="flex items-center gap-1 text-[11px] text-olive-dark/50">
      <Clock size={11} />
      Prochain refresh : {mm}:{ss}
    </span>
  );
}

// ── View toggle ───────────────────────────────────────────────────────────────
type View = "list" | "map";

export default function AnomaliesPage() {
  const { results, loading, lastUpdated, refresh } = useAnomalyData();
  const [view,     setView]     = useState<View>("map");
  const [selected, setSelected] = useState<string>("");
  const [filterGov, setFilterGov] = useState<string>("Tous");
  const [filterSys, setFilterSys] = useState<string>("Tous");

  const govOptions = useMemo(() => {
    const govs = new Set(results.map((r) => r.gouvernorat));
    return ["Tous", ...Array.from(govs).sort()];
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (filterGov !== "Tous" && r.gouvernorat !== filterGov) return false;
      if (filterSys !== "Tous" && r.systeme !== filterSys) return false;
      return true;
    });
  }, [results, filterGov, filterSys]);

  // Auto-select first result once loaded
  useEffect(() => {
    if (filteredResults.length > 0 && !filteredResults.find(r => r.id === selected)) {
      setSelected(filteredResults[0].id);
    }
  }, [filteredResults, selected]);

  const parcel   = filteredResults.find((r) => r.id === selected) ?? filteredResults[0];
  const s        = parcel ? STATUS_META[parcel.status] : STATUS_META.normal;
  const trend    = parcel ? getTrend(parcel.history) : "stable";
  const zones    = resultsToZones(filteredResults);

  const criticalCount = filteredResults.filter((r) => r.status === "critical").length;
  const warningCount  = filteredResults.filter((r) => r.status === "warning").length;

  const backendOnline = results.length > 0 && !results.every((r) => r.error);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">

      {/* ── Header ── */}
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">Surveillance NDVI · Live</p>
            <h2 className="mt-2 text-3xl">Anomalies détectées</h2>
            <p className="mt-2 text-sm text-olive-dark/70">
              Données en temps réel depuis les parcelles. Rafraîchissement automatique toutes les <strong>5 minutes</strong>.
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/80 bg-white/50 p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-olive-dark/60">Gouvernorat</label>
              <select 
                value={filterGov} 
                onChange={e => setFilterGov(e.target.value)}
                className="rounded-lg border-none bg-white py-1.5 pl-3 pr-8 text-sm text-olive-dark shadow-sm focus:ring-2 focus:ring-olive-mid"
              >
                {govOptions.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-olive-dark/60">Système</label>
              <select 
                value={filterSys} 
                onChange={e => setFilterSys(e.target.value)}
                className="rounded-lg border-none bg-white py-1.5 pl-3 pr-8 text-sm text-olive-dark shadow-sm focus:ring-2 focus:ring-olive-mid"
              >
                <option value="Tous">Tous</option>
                <option value="intensif">Intensif</option>
                <option value="extensif">Extensif</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

          {/* Status badges + connectivity */}
          <div className="flex flex-wrap items-center gap-3">
            {loading ? (
              <span className="flex items-center gap-2 rounded-full bg-olive-mid/10 px-4 py-2 text-xs font-semibold text-olive-dark">
                <RefreshCw size={13} className="animate-spin" />
                Chargement des données…
              </span>
            ) : (
              <>
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
                <div className={clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                  backendOnline
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                )}>
                  {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {backendOnline ? "Backend connecté" : "Backend hors ligne"}
                </div>
              </>
            )}
          </div>

          {/* Right: refresh controls + view toggle */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[11px] text-olive-dark/40">
                  MAJ: {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
              <button
                onClick={refresh}
                disabled={loading}
                id="anomalies-refresh-btn"
                className="flex items-center gap-1.5 rounded-xl border border-olive-mid/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-olive-dark shadow-sm transition hover:bg-olive-mid hover:text-white disabled:opacity-40"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Rafraîchir
              </button>
            </div>
            {lastUpdated && <NextRefreshBadge lastUpdated={lastUpdated} />}

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

        </div>
      </section>

      {/* ── Loading skeleton ── */}
      {loading && results.length === 0 && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-3xl bg-white/50"
            />
          ))}
        </div>
      )}

      {/* ── Map view ── */}
      {!loading && view === "map" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { color: "#ef4444", label: "Critique (rouge)" },
              { color: "#f97316", label: "Attention (orange)" },
              { color: "#22c55e", label: "Normal (vert)" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span style={{ background: color, width: 12, height: 12, borderRadius: 3, display: "inline-block" }} />
                <span className="text-xs text-olive-dark/70">{label}</span>
              </div>
            ))}
            <span className="ml-2 text-xs italic text-olive-dark/50">
              Survolez un polygone · Cliquez pour analyser
            </span>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/70 shadow-olive" style={{ minHeight: 500 }}>
            <AnomalyZoneMap 
              zones={zones} 
              onSelectZone={(id) => { 
                setSelected(id); 
                setView("list"); 
                // Scroll to top smoothly
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} 
            />
          </div>
        </div>
      )}

      {/* ── NDVI Analysis view ── */}
      {!loading && view === "list" && filteredResults.length > 0 && parcel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
          {/* Parcel selector (Vertical List) */}
          <div className="flex flex-col gap-3 lg:col-span-1 overflow-y-auto max-h-[800px] pr-2">
            {filteredResults.map((r) => {
              const m = STATUS_META[r.status];
              return (
                <button
                  key={r.id}
                  id={`parcel-btn-${r.id}`}
                  onClick={() => setSelected(r.id)}
                  className={clsx(
                    "flex w-full shrink-0 flex-col gap-1 rounded-2xl border p-4 text-left transition",
                    selected === r.id
                      ? "border-olive-mid bg-white shadow-olive"
                      : "border-white/70 bg-white/60 hover:bg-white"
                  )}
                >
                  <span className={clsx("self-start rounded-full px-2 py-0.5 text-[10px] font-bold", m.cls)}>
                    {m.label}
                  </span>
                  <p className="text-sm font-semibold text-olive-dark leading-tight">{r.name}</p>
                  <p className="text-xs text-olive-dark/60">{r.systeme} · NDVI {r.ndvi_actuel.toFixed(2)}</p>
                  {r.error && (
                    <p className="text-[10px] text-red-400 truncate">⚠ {r.error}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail card */}
          <div className="lg:col-span-2 w-full min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-4 sm:p-6 shadow-olive backdrop-blur">

            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/60">{parcel.systeme} · {parcel.area_ha.toFixed(1)} ha</p>
                <h3 className="mt-1 text-xl font-bold text-olive-dark">{parcel.name}</h3>
                <p className="mt-1 text-xs text-olive-dark/60">📍 {parcel.lat.toFixed(4)}, {parcel.lng.toFixed(4)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>
                <span className="flex items-center gap-1 text-xs text-olive-dark/60">
                  {TREND_ICON[trend]}
                  Tendance {trend === "up" ? "haussière" : trend === "down" ? "baissière" : "stable"}
                </span>
                <div className="mt-1 flex flex-col items-end gap-1">
                  {parcel.lst_observe && parcel.lst_observe.length > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600">
                      🌡️ LST : {parcel.lst_observe[parcel.lst_observe.length - 1].toFixed(1)} °C
                    </span>
                  )}
                  {parcel.anomaly_score !== null && (
                    <span className="text-[11px] font-bold text-olive-dark/70">
                      Score anomalie : {parcel.anomaly_score.toFixed(2)}σ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* NDVI bars: observed vs expected */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {/* Observed */}
              <div>
                <div className="flex items-center justify-between text-xs text-olive-dark/60">
                  <span>NDVI observé</span>
                  <span className="font-bold text-olive-dark">{parcel.ndvi_actuel.toFixed(3)}</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-olive-mid/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(parcel.ndvi_actuel * 100, 100)}%`, backgroundColor: s.bar }}
                  />
                </div>
              </div>
              {/* Expected */}
              <div>
                <div className="flex items-center justify-between text-xs text-olive-dark/60">
                  <span>NDVI attendu (modèle)</span>
                  <span className="font-bold text-olive-dark">{parcel.ndvi_attendu_actuel.toFixed(3)}</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-olive-mid/10">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(parcel.ndvi_attendu_actuel * 100, 100)}%`, backgroundColor: "#94a3b8" }}
                  />
                </div>
              </div>
            </div>

            {/* Explanation banner */}
            <div className={clsx(
              "mb-5 rounded-2xl px-4 py-3 text-sm",
              parcel.status === "critical" ? "bg-red-50 text-red-700"
              : parcel.status === "warning" ? "bg-orange-50 text-orange-700"
              : "bg-green-50 text-green-700"
            )}>
              <p className="font-semibold">📋 {parcel.explication}</p>
              <p className="mt-1 text-xs opacity-80">→ {parcel.recommandation}</p>
            </div>

            {/* Chart: Observed vs Expected NDVI over 5 points */}
            {parcel.history.length > 0 && (
              <>
                <p className="mb-2 text-xs font-semibold text-olive-dark/60">
                  Historique NDVI — Observé vs Attendu (fenêtre 3 semaines)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={parcel.history} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradObserve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={s.bar} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={s.bar} stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gradAttendu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d4a1e10" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#2d4a1e80" }} />
                    <YAxis domain={[0.1, 0.9]} tick={{ fontSize: 10, fill: "#2d4a1e80" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #2d4a1e20", fontSize: 12 }}
                      formatter={(v: number, name: string) => [
                        v.toFixed(3),
                        name === "observe" ? "NDVI Observé" : "NDVI Attendu",
                      ]}
                    />
                    <Legend
                      formatter={(val) => val === "observe" ? "Observé (GEE)" : "Attendu (modèle)"}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Area
                      type="monotone" dataKey="attendu"
                      stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 3"
                      fill="url(#gradAttendu)" dot={{ r: 3, fill: "#94a3b8" }}
                    />
                    <Area
                      type="monotone" dataKey="observe"
                      stroke={s.bar} strokeWidth={2.5}
                      fill="url(#gradObserve)" dot={{ r: 4, fill: s.bar }} activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}

            {/* LST temperature (bonus) */}
            {parcel.lst_observe.length > 0 && (
              <div className="mt-4 rounded-2xl bg-olive-mid/5 px-4 py-3">
                <p className="mb-1 text-xs font-semibold text-olive-dark/60">🌡 Température de surface (LST) — °C</p>
                <div className="flex gap-3">
                  {parcel.lst_observe.map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-olive-dark">{t.toFixed(1)}°</span>
                      <span className="text-[10px] text-olive-dark/50">{["J-20","J-15","J-10","J-5","J-0"][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty / offline state ── */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-100 bg-red-50/60 p-10 text-center">
          <WifiOff size={40} className="text-red-400" />
          <p className="font-semibold text-red-600">Backend inaccessible</p>
          <p className="text-sm text-red-500">
            Assurez-vous que le serveur FastAPI tourne sur <code className="rounded bg-red-100 px-1">http://localhost:8000</code>
          </p>
          <button
            onClick={refresh}
            className="mt-2 rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Réessayer
          </button>
        </div>
      )}

    </div>
  );
}
