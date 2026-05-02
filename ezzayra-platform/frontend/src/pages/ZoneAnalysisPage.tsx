import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Droplets,
  Leaf,
  Bug,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { ANOMALY_ZONES, type AnomalyZone, type ZoneAnalysis } from "../data/anomaly-zones";

// ── constants ────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL_MS = 60_000; // 1 minute

const statusMeta: Record<AnomalyZone["status"], { label: string; bg: string; text: string; bar: string }> = {
  critical: { label: "Critique",  bg: "rgba(239,68,68,0.1)",  text: "#b91c1c", bar: "#ef4444" },
  warning:  { label: "Attention", bg: "rgba(249,115,22,0.1)", text: "#c2410c", bar: "#f97316" },
  normal:   { label: "Normal",    bg: "rgba(34,197,94,0.1)",  text: "#15803d", bar: "#22c55e" },
};

const riskMeta: Record<ZoneAnalysis["disease_risk"], { label: string; color: string }> = {
  high:   { label: "Élevé",  color: "#ef4444" },
  medium: { label: "Moyen",  color: "#f97316" },
  low:    { label: "Faible", color: "#22c55e" },
};

const fmtTs = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

// ── helpers ──────────────────────────────────────────────────────────────────
/** Simulates a refresh by slightly mutating analysis values (replace with real API call) */
function simulateFreshAnalyses(base: ZoneAnalysis[]): ZoneAnalysis[] {
  return base.map((a) => ({
    ...a,
    ndvi: Math.max(0, Math.min(1, a.ndvi + (Math.random() - 0.5) * 0.01)),
    humidity: Math.max(0, Math.min(100, a.humidity + Math.round((Math.random() - 0.5) * 2))),
    temperature: +(a.temperature + (Math.random() - 0.5) * 0.5).toFixed(1),
  }));
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.75)",
        border: "1.5px solid rgba(255,255,255,0.8)",
        borderRadius: 20,
        padding: "18px 20px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 800, color: "#2d4a1e", lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{unit}</span>}
      </p>
    </div>
  );
}

// ── Alert row ────────────────────────────────────────────────────────────────
const alertDotColors = { critical: "#ef4444", warning: "#f97316", info: "#3b82f6" };
const alertBgColors  = { critical: "rgba(239,68,68,0.08)", warning: "rgba(249,115,22,0.08)", info: "rgba(59,130,246,0.08)" };
const alertTextColors = { critical: "#991b1b", warning: "#9a3412", info: "#1e40af" };

function AlertRow({ alert }: { alert: AnomalyZone["alerts"][0] }) {
  const dot = alertDotColors[alert.severity];
  const bg  = alertBgColors[alert.severity];
  const tc  = alertTextColors[alert.severity];
  return (
    <div
      style={{
        background: bg,
        borderRadius: 14,
        padding: "10px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: tc, fontWeight: 600 }}>{alert.message}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <Clock size={10} color="#9ca3af" />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {fmtTs(alert.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ZoneAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const zone = ANOMALY_ZONES.find((z) => z.id === id);

  const [analyses, setAnalyses] = useState<ZoneAnalysis[]>(zone?.analyses ?? []);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => {
    if (!zone) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setAnalyses(simulateFreshAnalyses(zone.analyses));
      setLastRefresh(new Date());
      setCountdown(60);
      setIsRefreshing(false);
    }, 600);
  };

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [zone]);

  // Countdown ticker
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 60 : c - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  if (!zone) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#6b7280" }}>Zone introuvable.</p>
        <button
          onClick={() => navigate("/anomalies")}
          style={{ marginTop: 16, padding: "8px 20px", borderRadius: 12, border: "none", background: "#4a7c3f", color: "white", cursor: "pointer" }}
        >
          Retour aux anomalies
        </button>
      </div>
    );
  }

  const sm = statusMeta[zone.status];
  const latest = analyses[0];

  // Radar data from latest analysis
  const radarData = latest
    ? [
        { subject: "NDVI",       value: Math.round(latest.ndvi * 100) },
        { subject: "Humidité",   value: latest.humidity },
        { subject: "Température",value: Math.min(100, Math.round((latest.temperature / 40) * 100)) },
        { subject: "Santé",      value: latest.disease_risk === "low" ? 90 : latest.disease_risk === "medium" ? 55 : 20 },
      ]
    : [];

  const ndviChartData = [...analyses].reverse().map((a) => ({
    date: a.date.slice(0, 7),
    ndvi: +a.ndvi.toFixed(3),
    humidity: a.humidity,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Header ── */}
      <section
        style={{
          borderRadius: 24,
          border: "1.5px solid rgba(255,255,255,0.7)",
          background: "rgba(255,255,255,0.7)",
          padding: "24px 28px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(45,74,30,0.08)",
        }}
      >
        <button
          onClick={() => navigate("/anomalies")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(45,74,30,0.08)",
            border: "none",
            borderRadius: 12,
            padding: "6px 12px",
            cursor: "pointer",
            color: "#2d4a1e",
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={15} />
          Retour aux anomalies
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3em" }}>
              Analyses de zone
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#2d4a1e", margin: "6px 0 4px" }}>
              {zone.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  background: sm.bg,
                  color: sm.text,
                  borderRadius: 999,
                  padding: "3px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {sm.label}
              </span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {zone.alerts.length} alerte{zone.alerts.length !== 1 ? "s" : ""} active{zone.alerts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Refresh controls */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#4a7c3f",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "10px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: isRefreshing ? "not-allowed" : "pointer",
                opacity: isRefreshing ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <RefreshCw
                size={15}
                style={{
                  animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
                }}
              />
              {isRefreshing ? "Actualisation…" : "Actualiser"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#9ca3af" }}>
              <Clock size={12} />
              Prochain refresh : <strong style={{ color: "#6b7280" }}>{countdown}s</strong>
              &nbsp;· Dernière màj : {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI cards ── */}
      {latest && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          <StatCard icon={Leaf}        label="NDVI actuel"     value={latest.ndvi.toFixed(3)}         color={sm.bar} />
          <StatCard icon={Droplets}    label="Humidité sol"    value={latest.humidity}    unit="%"    color="#3b82f6" />
          <StatCard icon={Thermometer} label="Température"     value={latest.temperature} unit="°C"  color="#f97316" />
          <StatCard icon={Bug}         label="Risque maladie"  value={riskMeta[latest.disease_risk].label} color={riskMeta[latest.disease_risk].color} />
        </div>
      )}

      {/* ── Charts ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {/* NDVI Area Chart */}
        <div
          style={{
            borderRadius: 24,
            border: "1.5px solid rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.7)",
            padding: 24,
            backdropFilter: "blur(12px)",
          }}
        >
          <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
            Historique NDVI
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a1e", marginBottom: 20 }}>
            Évolution sur {ndviChartData.length} mois
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ndviChartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="ndviGradZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={sm.bar} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sm.bar} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,74,30,0.07)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis domain={[0.2, 0.8]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ borderRadius: 14, border: "1px solid rgba(45,74,30,0.1)", fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(3), "NDVI"]}
              />
              <Area
                type="monotone"
                dataKey="ndvi"
                stroke={sm.bar}
                strokeWidth={2.5}
                fill="url(#ndviGradZone)"
                dot={{ r: 4, fill: sm.bar }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div
          style={{
            borderRadius: 24,
            border: "1.5px solid rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.7)",
            padding: 24,
            backdropFilter: "blur(12px)",
          }}
        >
          <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
            Santé de la zone
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a1e", marginBottom: 12 }}>
            Indicateurs clés
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="rgba(45,74,30,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Radar
                name="Zone"
                dataKey="value"
                stroke={sm.bar}
                fill={sm.bar}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Analysis history table ── */}
      <div
        style={{
          borderRadius: 24,
          border: "1.5px solid rgba(255,255,255,0.7)",
          background: "rgba(255,255,255,0.7)",
          padding: 24,
          backdropFilter: "blur(12px)",
        }}
      >
        <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
          Historique complet
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2d4a1e", marginBottom: 20 }}>
          Toutes les analyses
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Date", "NDVI", "Humidité", "Temp.", "Risque maladie", "Notes"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: "#9ca3af",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      borderBottom: "1.5px solid rgba(45,74,30,0.08)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.map((a, i) => {
                const risk = riskMeta[a.disease_risk];
                return (
                  <tr
                    key={a.id}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(45,74,30,0.02)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(45,74,30,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(45,74,30,0.02)")}
                  >
                    <td style={{ padding: "12px", fontWeight: 600, color: "#374151" }}>{a.date}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 60,
                            height: 6,
                            borderRadius: 999,
                            background: "rgba(45,74,30,0.1)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${a.ndvi * 100}%`,
                              height: "100%",
                              background: sm.bar,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, color: "#2d4a1e" }}>{a.ndvi.toFixed(3)}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px", color: "#3b82f6", fontWeight: 600 }}>{a.humidity}%</td>
                    <td style={{ padding: "12px", color: "#f97316", fontWeight: 600 }}>{a.temperature}°C</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          background: `${risk.color}18`,
                          color: risk.color,
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {risk.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "#6b7280", fontStyle: "italic" }}>{a.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Alerts panel ── */}
      {zone.alerts.length > 0 && (
        <div
          style={{
            borderRadius: 24,
            border: "1.5px solid rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.7)",
            padding: 24,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color={sm.text} />
            <p style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Alertes actives — {zone.alerts.length}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {zone.alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {zone.alerts.length === 0 && (
        <div
          style={{
            borderRadius: 24,
            border: "1.5px solid rgba(34,197,94,0.3)",
            background: "rgba(34,197,94,0.05)",
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckCircle size={24} color="#22c55e" />
          <div>
            <p style={{ fontWeight: 700, color: "#15803d", fontSize: 15 }}>Zone en bonne santé</p>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              Aucune alerte active. Continuez la surveillance périodique.
            </p>
          </div>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
