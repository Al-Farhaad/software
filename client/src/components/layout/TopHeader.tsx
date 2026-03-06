import { Settings } from "lucide-react";

interface TopHeaderProps {
  onOpenSettings: () => void;
}

export const TopHeader = ({ onOpenSettings }: TopHeaderProps) => (
  <header className="tf-topbar">
    <div className="flex min-w-0 items-center gap-3">
      <img
        src="/taba-foundation-logo.jpg"
        alt="Taba Foundation"
        className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-[1.05rem] font-bold tracking-[0.01em] text-[var(--tf-navy)]">
          Taba Foundation
        </p>
        <p className="truncate text-xs text-slate-500">Donation Management System</p>
      </div>
    </div>
    <button
      className="rounded-lg border border-slate-200 bg-white p-2 text-[var(--tf-navy)] transition hover:bg-slate-50"
      type="button"
      onClick={onOpenSettings}
      aria-label="Open settings"
    >
      <Settings size={18} />
    </button>
  </header>
);
