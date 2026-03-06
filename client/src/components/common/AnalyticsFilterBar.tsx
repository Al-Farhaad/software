import type { AnalyticsFilterType } from "../../utils/analytics-filter";

interface AnalyticsFilterBarProps {
  filterType: AnalyticsFilterType;
  selectedDate: string;
  onFilterTypeChange: (value: AnalyticsFilterType) => void;
  onDateChange: (value: string) => void;
}

const FILTER_OPTIONS: Array<{ label: string; value: AnalyticsFilterType }> = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Day", value: "day" },
];

export const AnalyticsFilterBar = ({
  filterType,
  selectedDate,
  onFilterTypeChange,
  onDateChange,
}: AnalyticsFilterBarProps) => (
  <div className="rounded-xl border border-[var(--tf-border)] bg-white p-3">
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            filterType === option.value
              ? "bg-[var(--tf-purple)] text-white"
              : "border border-[var(--tf-border)] text-[var(--tf-navy)] hover:bg-slate-50"
          }`}
          type="button"
          onClick={() => onFilterTypeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>

    {filterType === "day" && (
      <div className="mt-3 w-full sm:w-64">
        <input
          className="tf-input"
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>
    )}
  </div>
);
