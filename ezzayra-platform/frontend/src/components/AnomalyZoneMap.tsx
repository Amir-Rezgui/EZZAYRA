import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsLiteral, LatLngTuple } from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, X, Clock, Layers } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { AnomalyZone, ZoneAlert } from "../data/anomaly-zones";

// ── Vivid status colors ───────────────────────────────────────────────────────
const statusColors: Record<
  AnomalyZone["status"],
  { fill: string; stroke: string; hover: string; glow: string; label: string }
> = {
  critical: { fill: "#ef4444", stroke: "#991b1b", hover: "#dc2626", glow: "rgba(239,68,68,0.45)",   label: "Critique"  },
  warning:  { fill: "#f97316", stroke: "#c2410c", hover: "#ea6b0a", glow: "rgba(249,115,22,0.40)",  label: "Attention" },
  normal:   { fill: "#22c55e", stroke: "#15803d", hover: "#16a34a", glow: "rgba(34,197,94,0.35)",   label: "Normal"    },
};

const severityMeta: Record<ZoneAlert["severity"], { bg: string; text: string; dot: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)",  text: "#b91c1c", dot: "#ef4444" },
  warning:  { bg: "rgba(249,115,22,0.12)", text: "#c2410c", dot: "#f97316" },
  info:     { bg: "rgba(59,130,246,0.12)", text: "#1d4ed8", dot: "#3b82f6" },
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 60_000);
  if (diff < 60)   return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.round(diff / 60)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

// ── Centroid from polygon coords [lng, lat][] ─────────────────────────────────
function centroid(coords: [number, number][]): LatLngTuple {
  const lats = coords.map(([, lat]) => lat);
  const lngs = coords.map(([lng]) => lng);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

// ── Fit map to all centroids on mount only ────────────────────────────────────
function FitToZones({ centers }: { centers: LatLngTuple[] }) {
  const map    = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || centers.length === 0) return;
    const lats = centers.map(([lat]) => lat);
    const lngs = centers.map(([, lng]) => lng);
    const bounds: LatLngBoundsLiteral = [
      [Math.min(...lats) - 0.8, Math.min(...lngs) - 0.8],
      [Math.max(...lats) + 0.8, Math.max(...lngs) + 0.8],
    ];
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11, animate: true });
    fitted.current = true;
  }, [map, centers]);

  return null;
}

// ── Rich hover popup (rendered in DOM, not inside Leaflet) ────────────────────
interface PopupProps {
  zone: AnomalyZone;
  pos: { x: number; y: number };
  onClose: () => void;
  onNavigate: () => void;
}

function ZonePopup({ zone, pos, onClose, onNavigate }: PopupProps) {
  const c = statusColors[zone.status];

  const left = Math.min(pos.x + 20, window.innerWidth  - 350);
  const top  = Math.min(pos.y - 10, window.innerHeight - 300);

  return (
    <div style={{ position: "fixed", left, top, zIndex: 9999, maxWidth: 330, pointerEvents: "auto" }}>
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          border: `1.5px solid ${c.fill}40`,
          borderRadius: 22,
          boxShadow: `0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px ${c.fill}15`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${c.fill}22, ${c.fill}08)`,
            borderBottom: `1px solid ${c.fill}20`,
            padding: "14px 16px",
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                background: c.fill,
                borderRadius: 8,
                padding: "3px 10px",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                boxShadow: `0 3px 10px ${c.glow}`,
              }}
            >
              {c.label}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e3a1a" }}>{zone.name}</span>
          </div>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 8,
              padding: "3px 6px", cursor: "pointer", color: "#64748b",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Alerts */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {zone.alerts.length === 0 ? (
            <p style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>✅ Aucune alerte active</p>
          ) : (
            zone.alerts.slice(0, 3).map((alert) => {
              const m = severityMeta[alert.severity];
              return (
                <div
                  key={alert.id}
                  style={{
                    background: m.bg, borderRadius: 12, padding: "8px 10px",
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, color: m.text, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                      {alert.message}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <Clock size={10} color="#9ca3af" />
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{fmt(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mini Chart */}
        {zone.history && zone.history.length > 0 && (
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>NDVI (3 sem)</span>
              <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#9ca3af" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 2, background: c.fill }}></span> Observé</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 2, background: "#9ca3af", borderTop: "1px dashed #9ca3af" }}></span> Modèle</span>
              </div>
            </div>
            <div style={{ height: 60, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={zone.history}>
                  <defs>
                    <linearGradient id={`grad-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.fill} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c.fill} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="observe" stroke={c.fill} strokeWidth={2} fill={`url(#grad-${zone.id})`} isAnimationActive={false} />
                  <Area type="monotone" dataKey="attendu" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="3 3" fill="none" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ padding: "0 16px 14px" }}>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onNavigate(); }}
            style={{
              width: "100%", background: `linear-gradient(135deg, ${c.fill}, ${c.hover})`,
              border: "none", borderRadius: 12, padding: "10px 0", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, color: "white", fontWeight: 700, fontSize: 13,
              boxShadow: `0 6px 20px ${c.glow}`, transition: "transform 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <AlertTriangle size={14} />
            Voir analyses détaillées
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface AnomalyZoneMapProps {
  zones: AnomalyZone[];
  onSelectZone?: (id: string) => void;
}

export function AnomalyZoneMap({ zones, onSelectZone }: AnomalyZoneMapProps) {
  const [hovered, setHovered] = useState<{ zone: AnomalyZone; pos: { x: number; y: number } } | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = () => { if (closeTimeout.current) { clearTimeout(closeTimeout.current); closeTimeout.current = null; } };
  const scheduleClose = useCallback(() => { clearClose(); closeTimeout.current = setTimeout(() => setHovered(null), 350); }, []);

  const handleOver = useCallback(
    (zone: AnomalyZone) => (e: LeafletMouseEvent) => {
      e.originalEvent.stopPropagation();
      clearClose();
      setHovered({ zone, pos: { x: e.originalEvent.clientX, y: e.originalEvent.clientY } });
    }, []
  );

  const handleMove = useCallback(
    (zone: AnomalyZone) => (e: LeafletMouseEvent) => {
      clearClose();
      setHovered((prev) =>
        prev?.zone.id === zone.id
          ? { zone, pos: { x: e.originalEvent.clientX, y: e.originalEvent.clientY } }
          : prev
      );
    }, []
  );

  const handleOut  = useCallback(() => scheduleClose(), [scheduleClose]);
  const handleClick = useCallback((zone: AnomalyZone) => () => {
    if (onSelectZone) onSelectZone(zone.id);
  }, [onSelectZone]);

  // Compute centroids (keeps zone coordinate integrity)
  const centers: LatLngTuple[] = zones.map((z) => centroid(z.coordinates));

  return (
    <>
      {/* Relative wrapper so the legend can be absolute-positioned over the map */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
        <MapContainer
          center={[34.5, 9.5]}
          zoom={7}
          scrollWheelZoom
          style={{ width: "100%", minHeight: 520 }}
        >
          {/* CartoDB Voyager — clean light basemap, good contrast */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Fit to all zones once on mount — never fires again */}
          <FitToZones centers={centers} />

          {zones.map((zone, i) => {
            const c         = statusColors[zone.status];
            const center    = centers[i];
            const isHovered = hovered?.zone.id === zone.id;

            return (
              <CircleMarker
                key={zone.id}
                center={center}
                radius={isHovered ? 32 : 22}
                pathOptions={{
                  color:       c.stroke,
                  fillColor:   c.fill,
                  weight:      isHovered ? 4 : 2.5,
                  fillOpacity: isHovered ? 0.95 : 0.82,
                  opacity:     1,
                }}
                eventHandlers={{
                  mouseover: handleOver(zone),
                  mousemove: handleMove(zone),
                  mouseout:  handleOut,
                  click:     handleClick(zone),
                }}
              >
                <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent={false}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#1e3a1a" }}>
                    {zone.name}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend — anchored bottom-left inside the map frame */}
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: 14,
            padding: "10px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Layers size={12} color="#6b7280" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Légende
            </span>
          </div>
          {(["critical", "warning", "normal"] as const).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: statusColors[s].fill, flexShrink: 0,
                border: `2px solid ${statusColors[s].stroke}`,
                boxShadow: `0 0 6px ${statusColors[s].glow}`,
              }} />
              <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{statusColors[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rich popup rendered OUTSIDE Leaflet — prevents any zoom/re-render glitch */}
      {hovered && (
        <div onMouseEnter={clearClose} onMouseLeave={scheduleClose}>
          <ZonePopup
            zone={hovered.zone}
            pos={hovered.pos}
            onClose={() => setHovered(null)}
            onNavigate={handleClick(hovered.zone)}
          />
        </div>
      )}
    </>
  );
}
