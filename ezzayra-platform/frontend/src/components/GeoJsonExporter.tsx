import clsx from "clsx";

type GeoJsonExporterProps = {
  onExport: () => void | Promise<void>;
  disabled?: boolean;
};

export function GeoJsonExporter({ onExport, disabled }: GeoJsonExporterProps) {
  return (
    <button
      className={clsx(
        "rounded-2xl border border-olive-mid/40 bg-white/80 px-5 py-3 text-sm font-semibold text-olive-dark transition hover:bg-white",
        disabled && "cursor-not-allowed opacity-60"
      )}
      onClick={onExport}
      disabled={disabled}
    >
      Exporter GeoJSON
    </button>
  );
}
