import {
  BarChart3,
  CirclePlus,
  House,
  Landmark,
  type LucideIcon,
  Settings,
  UsersRound,
} from "lucide-react";
import type { AppTab } from "../types/ui";

interface AppNavItem {
  id: AppTab;
  label: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "contributors", label: "Contributors", icon: UsersRound },
  { id: "collection", label: "Collection", icon: CirclePlus },
  { id: "investments", label: "Investments", icon: Landmark },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const BOTTOM_NAV_ITEMS = APP_NAV_ITEMS.filter((item) => item.id !== "settings");
