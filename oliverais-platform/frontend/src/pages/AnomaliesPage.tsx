import { AlertTriangle } from "lucide-react";

const alerts = [
  {
    id: "P-102",
    zone: "Sfax Sud",
    status: "warning",
    ndvi: 0.42
  },
  {
    id: "P-118",
    zone: "Kebili",
    status: "critical",
    ndvi: 0.31
  },
  {
    id: "P-099",
    zone: "Monastir",
    status: "warning",
    ndvi: 0.46
  }
];

export default function AnomaliesPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-olive backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-olive-dark/70">
          Surveillance NDVI
        </p>
        <h2 className="mt-2 text-3xl">Anomalies detectees</h2>
        <p className="mt-2 text-sm text-olive-dark/70">
          Suivez les parcelles avec risque hydrique ou maladie.
        </p>
      </section>

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/70 p-5 shadow-olive backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-olive-mid/15 text-olive-dark">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-olive-dark">
                  {alert.zone}
                </p>
                <p className="text-xs text-olive-dark/70">{alert.id}</p>
              </div>
            </div>
            <div className="text-right text-xs text-olive-dark/70">
              <p className="font-semibold text-olive-dark">{alert.status}</p>
              <p>NDVI {alert.ndvi}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
