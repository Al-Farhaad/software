import { APP_NAV_ITEMS } from "../../data/app-navigation";
import type { AppTab } from "../../types/ui";

interface DesktopSidebarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

export const DesktopSidebar = ({ activeTab, onChange }: DesktopSidebarProps) => (
  <aside className="tf-desktop-sidebar">
    <div className="tf-user-card">
      <div className="h-8 w-8 rounded-full bg-[linear-gradient(130deg,#0b245c,#11844a)]" />
      <div>
        <p className="text-sm font-semibold text-slate-900">Taba Foundation</p>
        <p className="text-xs text-slate-500">Donation Management</p>
      </div>
    </div>

    <nav className="mt-6 space-y-1.5">
      {APP_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`tf-sidebar-item ${activeTab === id ? "tf-sidebar-item-active" : ""}`}
          type="button"
          onClick={() => onChange(id)}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </nav>

    <div className="tf-side-promo">
      <p className="text-xs uppercase tracking-[0.13em] text-white/80">Taba Foundation</p>
      <p className="mt-2 text-sm font-semibold text-white">Track campaigns and donor impact.</p>
      <button className="mt-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0b245c]">
        Invite Team
      </button>
    </div>
  </aside>
);
