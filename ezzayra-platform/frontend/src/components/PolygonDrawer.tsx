import { FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import type { Polygon } from "geojson";

type PolygonDrawerProps = {
  onCreated: (polygon: Polygon) => void;
};

export function PolygonDrawer({ onCreated }: PolygonDrawerProps) {
  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        onCreated={(event: any) => {
          const geojson = event.layer.toGeoJSON();
          if (geojson?.geometry?.type === "Polygon") {
            onCreated(geojson.geometry as Polygon);
          }
        }}
        draw={{
          polygon: true,
          polyline: false,
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false
        }}
        edit={{
          edit: false,
          remove: true
        }}
      />
    </FeatureGroup>
  );
}
