import { BOTTOM_NAV_ITEMS } from "../../data/app-navigation";
import type { AppTab } from "../../types/ui";

interface BottomTabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

export const BottomTabBar = ({ activeTab, onChange }: BottomTabBarProps) => (
  <nav
    className="tf-bottom-nav"
    style={{ gridTemplateColumns: `repeat(${BOTTOM_NAV_ITEMS.length}, minmax(0, 1fr))` }}
  >
    {BOTTOM_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        className={`tf-bottom-item ${activeTab === id ? "tf-bottom-item-active" : ""}`}
        type="button"
        onClick={() => onChange(id)}
      >
        <Icon size={17} />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);
