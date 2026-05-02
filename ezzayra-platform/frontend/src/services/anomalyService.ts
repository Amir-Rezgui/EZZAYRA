/**
 * anomalyService.ts
 * Connects the Anomalies page to the real Sujet3Back FastAPI backend.
 * Endpoint: POST http://localhost:8000/api/diagnostic-anomalie
 * Auto-refreshes every 5 minutes via useAnomalyData hook.
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types matching server.py response ─────────────────────────────────────────
export type StatutAPI = "rouge" | "orange" | "vert";

export interface DiagnosticRequest {
  oliveraie: {
    id: string;
    polygone: { lat: number; lng: number }[];
    systeme: "intensif" | "extensif";
  };
  date: string;                    // YYYY-MM-DD
  ndvi_observe?: number[];
}

export interface DiagnosticResponse {
  lat: number;
  lng: number;
  area_ha: number;
  ndvi_attendu: number[];
  ndvi_observe: number[];
  lst_observe: number[];
  residual: number | null;
  anomaly_score: number | null;
  statut: StatutAPI;
  explication: string;
  recommandation: string;
}

// ── UI-mapped result (what AnomaliesPage consumes) ────────────────────────────
export interface AnomalyResult {
  id: string;
  name: string;
  gouvernorat: string;
  systeme: "intensif" | "extensif";
  statut: StatutAPI;
  status: "normal" | "warning" | "critical";   // mapped from statut
  ndvi_actuel: number;                          // last observed NDVI
  ndvi_attendu_actuel: number;                  // last expected NDVI
  anomaly_score: number | null;
  residual: number | null;
  explication: string;
  recommandation: string;
  area_ha: number;
  lat: number;
  lng: number;
  /** Recharts-ready history: last 5 points */
  history: { label: string; observe: number; attendu: number }[];
  /** Polygon for map */
  polygone: { lat: number; lng: number }[];
  /** LST temperature series */
  lst_observe: number[];
  error?: string;
}

// ── Parcelles à surveiller (issues des JSON réels) ───────────────────────────
import intensifsData from "../../public/parcellesOliviersIntensifs.json";
import extensifsData from "../../public/parcelles_OlivierExtensif.json";

// Take all parcels from the JSON files
const intensifs = intensifsData.parcels.map((p) => ({
  oliveraie: {
    id: p.id,
    polygone: p.coordinates,
    systeme: "intensif" as const,
  },
  date: new Date().toISOString().split("T")[0],
}));

const extensifs = extensifsData.parcels.map((p) => ({
  oliveraie: {
    id: p.id,
    polygone: p.coordinates,
    systeme: "extensif" as const,
  },
  date: new Date().toISOString().split("T")[0],
}));

export const MONITORED_PARCELS: DiagnosticRequest[] = [...intensifs, ...extensifs];

// ── Human-readable names for each parcel ID ───────────────────────────────────
// We map the real JSON parcel names to their IDs dynamically
const PARCEL_NAMES: Record<string, string> = {};
[...intensifsData.parcels, ...extensifsData.parcels].forEach((p) => {
  PARCEL_NAMES[p.id] = p.name;
});

// ── Status mapping ────────────────────────────────────────────────────────────
function statutToStatus(s: StatutAPI): "normal" | "warning" | "critical" {
  if (s === "rouge")  return "critical";
  if (s === "orange") return "warning";
  return "normal";
}

// ── Recharts labels for the 5-point window (J-20 … J-0) ─────────────────────
const HISTORY_LABELS = ["J-20", "J-15", "J-10", "J-5", "J-0"];

// ── API base URL (falls back to localhost) ───────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8000";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min

// ── Low-level fetch ───────────────────────────────────────────────────────────
async function fetchDiagnostic(req: DiagnosticRequest): Promise<DiagnosticResponse> {
  const res = await fetch(`${API_BASE}/api/diagnostic-anomalie`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json() as Promise<DiagnosticResponse>;
}

// ── Geocoding helper ──────────────────────────────────────────────────────────
function guessGovernorate(lat: number, lng: number): string {
  if (lat > 36.4) return "Nabeul";
  if (lat > 35.8) return "Sousse";
  if (lat > 35.3) return "Mahdia";
  if (lat > 35.0) return "Kairouan";
  if (lat > 34.6 && lng < 9.5) return "Sidi Bouzid";
  if (lat > 34.6) return "Sfax";
  if (lat > 34.0) return "Gafsa";
  return "Gabès";
}

// ── Map API response → UI result ──────────────────────────────────────────────
function mapToResult(req: DiagnosticRequest, resp: DiagnosticResponse): AnomalyResult {
  const id   = req.oliveraie.id;
  const obs  = resp.ndvi_observe;
  const att  = resp.ndvi_attendu;

  // Build 5-point history (pad shorter arrays)
  const history = HISTORY_LABELS.map((label, i) => ({
    label,
    observe: obs[i] ?? obs[obs.length - 1] ?? 0,
    attendu: att[i] ?? att[att.length - 1] ?? 0,
  }));

  return {
    id,
    name:                PARCEL_NAMES[id] ?? id,
    gouvernorat:         guessGovernorate(resp.lat, resp.lng),
    systeme:             req.oliveraie.systeme,
    statut:              resp.statut,
    status:              statutToStatus(resp.statut),
    ndvi_actuel:         obs[obs.length - 1] ?? 0,
    ndvi_attendu_actuel: att[att.length - 1] ?? 0,
    anomaly_score:       resp.anomaly_score,
    residual:            resp.residual,
    explication:         resp.explication,
    recommandation:      resp.recommandation,
    area_ha:             resp.area_ha,
    lat:                 resp.lat,
    lng:                 resp.lng,
    history,
    polygone:            req.oliveraie.polygone,
    lst_observe:         resp.lst_observe,
  };
}

// ── React hook: fetches all parcels, refreshes every 5 min ───────────────────
export interface UseAnomalyDataReturn {
  results:     AnomalyResult[];
  loading:     boolean;
  lastUpdated: Date | null;
  refresh:     () => void;
}

let globalCache: {
  results: AnomalyResult[];
  lastUpdated: Date | null;
} | null = null;

export function useAnomalyData(): UseAnomalyDataReturn {
  const [results,     setResults]     = useState<AnomalyResult[]>(globalCache?.results || []);
  const [loading,     setLoading]     = useState(globalCache === null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(globalCache?.lastUpdated || null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!globalCache) setLoading(true);

    // Build requests with today's date (updated at call time)
    const today = new Date().toISOString().split("T")[0];
    const requests = MONITORED_PARCELS.map((p) => ({
      ...p,
      date: today,
    }));

    const settled = await Promise.allSettled(
      requests.map((req) => fetchDiagnostic(req))
    );

    const mapped: AnomalyResult[] = settled.map((result, idx) => {
      const req = requests[idx];
      if (result.status === "fulfilled") {
        return mapToResult(req, result.value);
      }
      // Fallback on error — keep parcel visible with error state
      const err = (result.reason as Error).message ?? "Erreur API";
      return {
        id:                  req.oliveraie.id,
        name:                PARCEL_NAMES[req.oliveraie.id] ?? req.oliveraie.id,
        gouvernorat:         guessGovernorate(req.oliveraie.polygone[0].lat, req.oliveraie.polygone[0].lng),
        systeme:             req.oliveraie.systeme,
        statut:              "vert" as StatutAPI,
        status:              "normal" as const,
        ndvi_actuel:         0,
        ndvi_attendu_actuel: 0,
        anomaly_score:       null,
        residual:            null,
        explication:         "Données indisponibles",
        recommandation:      "Réessayer dans quelques minutes",
        area_ha:             0,
        lat:                 req.oliveraie.polygone[0].lat,
        lng:                 req.oliveraie.polygone[0].lng,
        history:             [],
        polygone:            req.oliveraie.polygone,
        lst_observe:         [],
        error:               err,
      } satisfies AnomalyResult;
    });

    globalCache = { results: mapped, lastUpdated: new Date() };
    setResults(globalCache.results);
    setLastUpdated(globalCache.lastUpdated);
    setLoading(false);
  }, []);

  // Initial fetch + 5-min interval
  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  return { results, loading, lastUpdated, refresh: fetchAll };
}
