import { useMemo } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import type { LeafletMouseEvent } from "leaflet";

import { Parcel } from "../services/api";
import { PolygonDrawer } from "./PolygonDrawer";

type LeafletMapProps = {
  parcelles: Parcel[];
  selectedParcelId?: string;
  onParcelClick?: (parcelId: string) => void;
  onPolygonCreated?: (polygon: GeoJSON.Polygon) => void;
  enableDraw?: boolean;
};

const statusColors: Record<string, string> = {
  normal: "#22c55e",
  warning: "#f97316",
  critical: "#ef4444"
};

export function LeafletMap({
  parcelles,
  selectedParcelId,
  onParcelClick,
  onPolygonCreated,
  enableDraw = true
}: LeafletMapProps) {
  const featureCollection: FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: parcelles.map((parcel) => ({
        type: "Feature",
        geometry: parcel.geometry,
        properties: {
          id: parcel.id,
          classification: parcel.classification,
          ndvi_score: parcel.ndvi_score,
          anomaly_status: parcel.anomaly_status
        }
      }))
    }),
    [parcelles]
  );

  const onEachFeature = (feature: Feature, layer: any) => {
    const properties = feature.properties as Record<string, any>;
    const status = properties?.anomaly_status || "normal";
    const ndvi = properties?.ndvi_score ? Number(properties.ndvi_score).toFixed(2) : "-";
    layer.bindPopup(
      `<strong>Classification:</strong> ${properties?.classification || "-"}<br />` +
        `<strong>NDVI:</strong> ${ndvi}<br />` +
        `<strong>Statut:</strong> ${status}`
    );
    layer.on("click", () => {
      if (properties?.id && onParcelClick) {
        onParcelClick(properties.id as string);
      }
    });
  };

  const style = (feature?: Feature) => {
    const status = feature?.properties?.anomaly_status ?? "normal";
    const color = statusColors[status] ?? statusColors.normal;
    const isSelected =
      selectedParcelId && feature?.properties?.id === selectedParcelId;
    return {
      color,
      weight: isSelected ? 3.5 : 2,
      fillColor: color,
      fillOpacity: isSelected ? 0.5 : 0.35
    };
  };

  return (
    <MapContainer
      center={[33.8869, 9.5375]}
      zoom={7}
      scrollWheelZoom
      className="min-h-[520px] w-full shadow-olive"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={featureCollection as GeoJsonObject} style={style} onEachFeature={onEachFeature} />
      {enableDraw && onPolygonCreated && (
        <PolygonDrawer onCreated={onPolygonCreated} />
      )}
    </MapContainer>
  );
}
