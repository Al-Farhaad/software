import { LogOut, Settings } from "lucide-react";
import type { AuthUser } from "../../types/auth";

interface TopHeaderProps {
  currentUser: AuthUser;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const TopHeader = ({ currentUser, onOpenSettings, onLogout }: TopHeaderProps) => (
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
        <p className="truncate text-xs text-slate-500">
          {currentUser.name} ({currentUser.role === "superadmin" ? "Super Admin" : "Sub Admin"})
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        className="rounded-lg border border-slate-200 bg-white p-2 text-[var(--tf-navy)] transition hover:bg-slate-50"
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings"
      >
        <Settings size={18} />
      </button>
      <button
        className="rounded-lg border border-slate-200 bg-white p-2 text-[var(--tf-navy)] transition hover:bg-slate-50"
        type="button"
        onClick={onLogout}
        aria-label="Log out"
      >
        <LogOut size={18} />
      </button>
    </div>
  </header>
);
