import { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { MapPin } from "lucide-react";
import type { FeatureCollection } from "geojson";

import { api, Parcel } from "../services/api";
import { LeafletMap } from "../components/LeafletMap";
import { GeoJsonExporter } from "../components/GeoJsonExporter";
import { ParcelCard } from "../components/ParcelCard";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const buildFeatureCollection = (parcelles: Parcel[]): FeatureCollection => ({
  type: "FeatureCollection",
  features: parcelles.map((parcel) => ({
    type: "Feature",
    geometry: parcel.geometry,
    properties: {
      id: parcel.id,
      classification: parcel.classification,
      ndvi_score: parcel.ndvi_score,
      anomaly_status: parcel.anomaly_status,
      confidence: parcel.confidence
    }
  }))
});

export default function MapPage() {
  const [parcelles, setParcelles] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      api.getDemoParcelles().then(setParcelles).catch(() => setParcelles([]));
    }
  }, []);

  const exportGeojson = useMemo(() => buildFeatureCollection(parcelles), [parcelles]);

  const handleAnalyze = async () => {
    if (!drawnPolygon) return;
    setLoading(true);
    try {
      const response = await api.analyzePolygon(drawnPolygon);
      setParcelles(response.parcelles);
      setJobId(response.job_id);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (jobId) {
      const blob = await api.exportGeoJSON(jobId);
      saveAs(blob, `ezzayra_${jobId}.geojson`);
      return;
    }

    if (exportGeojson.features.length > 0) {
      const blob = new Blob([JSON.stringify(exportGeojson, null, 2)], {
        type: "application/geo+json"
      });
      saveAs(blob, "ezzayra_demo.geojson");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">
              Carte interactive
            </p>
            <h2 className="mt-2 text-3xl">Zones d'oliveraies tunisiennes</h2>
            <p className="mt-2 text-sm text-olive-dark/70">
              Tracez une zone, lancez l'analyse, puis exportez vos parcelles en
              GeoJSON.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {drawnPolygon && (
              <button
                className="rounded-2xl bg-olive-mid px-5 py-3 text-sm font-semibold text-white shadow-olive transition hover:bg-olive-dark"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? "Analyse en cours..." : "Analyser zone"}
              </button>
            )}
            <GeoJsonExporter onExport={handleExport} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <LeafletMap
          parcelles={parcelles}
          selectedParcelId={selectedParcelId ?? undefined}
          onParcelClick={setSelectedParcelId}
          onPolygonCreated={setDrawnPolygon}
          enableDraw
        />

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-olive-dark">
              <MapPin size={16} />
              Parcelles detectees
            </div>
            <p className="mt-2 text-xs text-olive-dark/70">
              {parcelles.length} parcelles chargees
            </p>
          </div>

          <div className="grid gap-4">
            {parcelles.length === 0 && (
              <div className="rounded-3xl border border-dashed border-olive-mid/40 bg-white/70 p-6 text-sm text-olive-dark/70">
                Tracez un polygone sur la carte pour lancer l'analyse.
              </div>
            )}
            {parcelles.map((parcel) => (
              <ParcelCard
                key={parcel.id}
                parcel={parcel}
                selected={parcel.id === selectedParcelId}
                onSelect={() => setSelectedParcelId(parcel.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
