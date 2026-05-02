import { useCallback, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, X, Clock } from "lucide-react";
import type { AnomalyZone, ZoneAlert } from "../data/anomaly-zones";

// ── helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<AnomalyZone["status"], { fill: string; stroke: string; hover: string }> = {
  critical: { fill: "#ef4444", stroke: "#b91c1c", hover: "#f87171" },
  warning:  { fill: "#f97316", stroke: "#c2410c", hover: "#fb923c" },
  normal:   { fill: "#22c55e", stroke: "#15803d", hover: "#4ade80" },
};

const severityMeta: Record<ZoneAlert["severity"], { bg: string; text: string; dot: string }> = {
  critical: { bg: "rgba(239,68,68,0.12)",  text: "#b91c1c", dot: "#ef4444" },
  warning:  { bg: "rgba(249,115,22,0.12)", text: "#c2410c", dot: "#f97316" },
  info:     { bg: "rgba(59,130,246,0.12)", text: "#1d4ed8", dot: "#3b82f6" },
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  const diff = Math.round((Date.now() - d.getTime()) / 60_000);
  if (diff < 60) return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.round(diff / 60)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

// ── Sub-component: resets map view when zones change ─────────────────────────
function MapResetter() {
  const map = useMap();
  map.setView([34.0, 9.5], 6);
  return null;
}

// ── Hover tooltip (portal-like div positioned on screen) ─────────────────────
interface TooltipProps {
  zone: AnomalyZone;
  pos: { x: number; y: number };
  onClose: () => void;
  onNavigate: () => void;
}

function ZoneTooltip({ zone, pos, onClose, onNavigate }: TooltipProps) {
  const colors = statusColors[zone.status];
  const statusLabel: Record<AnomalyZone["status"], string> = {
    critical: "Critique",
    warning: "Attention",
    normal: "Normal",
  };

  // Smart placement: avoid overflow on right/bottom
  const left = pos.x + 16;
  const top  = pos.y - 16;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 9999,
        maxWidth: 320,
        pointerEvents: "auto",
      }}
      className="animate-in fade-in slide-in-from-bottom-2"
    >
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          border: `1.5px solid ${colors.stroke}30`,
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.fill}18, ${colors.fill}08)`,
            borderBottom: `1px solid ${colors.stroke}20`,
            padding: "12px 16px",
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              style={{ background: colors.fill, borderRadius: 8, padding: "4px 10px" }}
              className="flex items-center gap-1.5"
            >
              <span
                style={{ background: "white", borderRadius: "50%", width: 6, height: 6 }}
              />
              <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>
                {statusLabel[zone.status]}
              </span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#2d4a1e" }}>
              {zone.name}
            </span>
          </div>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              padding: "2px 4px",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Alerts */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {zone.alerts.length === 0 ? (
            <p style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
              Aucune alerte active pour cette zone.
            </p>
          ) : (
            zone.alerts.slice(0, 4).map((alert) => {
              const m = severityMeta[alert.severity];
              return (
                <div
                  key={alert.id}
                  style={{
                    background: m.bg,
                    borderRadius: 12,
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: m.dot,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: m.text, fontWeight: 600, lineHeight: 1.4 }}>
                      {alert.message}
                    </p>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}
                    >
                      <Clock size={10} color="#9ca3af" />
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>
                        {fmt(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {zone.alerts.length > 4 && (
            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
              +{zone.alerts.length - 4} autres alertes
            </p>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: "0 16px 14px" }}>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onNavigate(); }}
            style={{
              width: "100%",
              background: colors.fill,
              border: "none",
              borderRadius: 12,
              padding: "9px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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

// ── Main component ────────────────────────────────────────────────────────────
interface AnomalyZoneMapProps {
  zones: AnomalyZone[];
}

export function AnomalyZoneMap({ zones }: AnomalyZoneMapProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<{ zone: AnomalyZone; pos: { x: number; y: number } } | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setHovered(null), 300);
  }, []);

  const handleMouseOver = useCallback(
    (zone: AnomalyZone) => (e: LeafletMouseEvent) => {
      clearCloseTimeout();
      setHovered({ zone, pos: { x: e.originalEvent.clientX, y: e.originalEvent.clientY } });
    },
    []
  );

  const handleMouseMove = useCallback(
    (zone: AnomalyZone) => (e: LeafletMouseEvent) => {
      clearCloseTimeout();
      setHovered((prev) =>
        prev?.zone.id === zone.id
          ? { zone, pos: { x: e.originalEvent.clientX, y: e.originalEvent.clientY } }
          : prev
      );
    },
    []
  );

  const handleMouseOut = useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  const handleClick = useCallback(
    (zone: AnomalyZone) => () => {
      navigate(`/anomalies/zone/${zone.id}`);
    },
    [navigate]
  );

  return (
    <>
      <MapContainer
        center={[34.0, 9.5]}
        zoom={6}
        scrollWheelZoom
        style={{ width: "100%", minHeight: 480, borderRadius: 20 }}
        className="shadow-olive"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResetter />

        {zones.map((zone) => {
          const isHovered = hovered?.zone.id === zone.id;
          const colors = statusColors[zone.status];
          // GeoJSON is [lng,lat] → Leaflet wants [lat,lng]
          const positions = zone.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color:       isHovered ? colors.hover  : colors.stroke,
                fillColor:   isHovered ? colors.hover  : colors.fill,
                weight:      isHovered ? 3 : 2,
                fillOpacity: isHovered ? 0.55 : 0.35,
                dashArray:   zone.status === "normal" ? "6 4" : undefined,
              }}
              eventHandlers={{
                mouseover: handleMouseOver(zone),
                mousemove: handleMouseMove(zone),
                mouseout:  handleMouseOut,
                click:     handleClick(zone),
              }}
            />
          );
        })}
      </MapContainer>

      {hovered && (
        <div
          onMouseEnter={clearCloseTimeout}
          onMouseLeave={scheduleClose}
        >
          <ZoneTooltip
            zone={hovered.zone}
            pos={hovered.pos}
            onClose={() => setHovered(null)}
            onNavigate={() => navigate(`/anomalies/zone/${hovered.zone.id}`)}
          />
        </div>
      )}
    </>
  );
}
