import { ChartNoAxesCombined, HandHeart, Inbox, Settings } from "lucide-react";

export const SIDEBAR_ITEMS = [
  { title: "Dashboard", icon: ChartNoAxesCombined, active: true },
  { title: "Donations", icon: HandHeart, active: true },
  { title: "Receipts", icon: Inbox, active: false },
  { title: "Settings", icon: Settings, active: false },
];
