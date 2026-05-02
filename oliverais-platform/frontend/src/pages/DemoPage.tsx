import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import type { FeatureCollection } from "geojson";

import { api, Parcel } from "../services/api";
import { LeafletMap } from "../components/LeafletMap";
import { GeoJsonExporter } from "../components/GeoJsonExporter";

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

const speakDemo = () => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(
    "Marhba, hadhi demo EZZAYRA. El analyse ta3mal tasnif w NDVI fi 45 secondes."
  );
  utterance.lang = "ar-TN";
  window.speechSynthesis.speak(utterance);
};

export default function DemoPage() {
  const [parcelles, setParcelles] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const exportGeojson = useMemo(() => buildFeatureCollection(parcelles), [parcelles]);

  const runDemo = async () => {
    setLoading(true);
    setReady(false);
    setTimeout(async () => {
      try {
        const data = await api.getDemoParcelles();
        setParcelles(data);
        setReady(true);
        speakDemo();
      } finally {
        setLoading(false);
      }
    }, 1800);
  };

  const handleExport = async () => {
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
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">
          Demo jury
        </p>
        <h2 className="mt-2 text-3xl">Lancer la demo complete</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          Une seule action pour visualiser l'analyse et exporter les parcelles.
        </p>
        <p className="mt-2 text-xs text-olive-dark/60">
          Mode demo base sur des donnees prechargees, en attente des modeles
          finaux de l'equipe IA.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={runDemo}
            className="rounded-2xl bg-olive-mid px-6 py-3 text-sm font-semibold text-white shadow-olive transition hover:bg-olive-dark"
            disabled={loading}
          >
            {loading ? "Simulation en cours..." : "Lancer la demo complete"}
          </button>
          <GeoJsonExporter onExport={handleExport} disabled={!ready} />
        </div>
      </section>

      <LeafletMap parcelles={parcelles} enableDraw={false} />
    </div>
  );
}
