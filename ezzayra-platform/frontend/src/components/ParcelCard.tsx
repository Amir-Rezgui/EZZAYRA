import clsx from "clsx";

import { Parcel } from "../services/api";
import { AnomalyBadge } from "./AnomalyBadge";

type ParcelCardProps = {
  parcel: Parcel;
  selected?: boolean;
  onSelect?: () => void;
};

export function ParcelCard({ parcel, selected, onSelect }: ParcelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        "w-full rounded-3xl border bg-white/70 p-5 text-left shadow-olive backdrop-blur transition",
        selected
          ? "border-olive-mid/70 ring-2 ring-olive-mid/40"
          : "border-white/70 hover:border-olive-mid/40"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-olive-dark">
            Parcelle {parcel.id.slice(0, 4)}
          </p>
          <p className="text-xs text-olive-dark/70">
            {parcel.classification}
          </p>
        </div>
        <AnomalyBadge status={parcel.anomaly_status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-olive-dark/70">
        <span>NDVI {parcel.ndvi_score.toFixed(2)}</span>
        <span>Confiance {parcel.confidence.toFixed(2)}</span>
      </div>
    </button>
  );
}
