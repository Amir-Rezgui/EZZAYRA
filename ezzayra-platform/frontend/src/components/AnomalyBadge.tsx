import clsx from "clsx";

type AnomalyBadgeProps = {
  status: "normal" | "warning" | "critical";
};

export function AnomalyBadge({ status }: AnomalyBadgeProps) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
        status === "normal" && "bg-green-100 text-green-700",
        status === "warning" && "bg-orange-100 text-orange-700",
        status === "critical" && "bg-red-100 text-red-700"
      )}
    >
      {status}
    </span>
  );
}
