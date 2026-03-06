import type { LucideIcon } from "lucide-react";

type MetricVariant = "purple" | "white" | "amber";

interface MetricCardProps {
  title: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  variant?: MetricVariant;
}

export const MetricCard = ({
  title,
  value,
  helper,
  icon: Icon,
  variant = "white",
}: MetricCardProps) => (
  <article className={`tf-metric-card tf-metric-${variant}`}>
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-1.5 max-w-full text-[clamp(1.2rem,6.8vw,1.8125rem)] font-bold leading-none tracking-tight break-words">
          {value}
        </p>
      </div>
      <span className="tf-icon-pill">
        <Icon size={17} />
      </span>
    </div>
    <p className="mt-1.5 text-xs">{helper}</p>
  </article>
);
