import { ChartNoAxesColumn, HandCoins, IndianRupee, Scale } from "lucide-react";

type StatCardIcon = "count" | "money" | "average" | "recent";

const iconByType = {
  count: HandCoins,
  money: IndianRupee,
  average: Scale,
  recent: ChartNoAxesColumn,
};

interface StatCardProps {
  title: string;
  value: string | number;
  helper: string;
  icon: StatCardIcon;
}

export const StatCard = ({ title, value, helper, icon }: StatCardProps) => {
  const Icon = iconByType[icon];

  return (
    <article className="panel">
      <div className="mb-4 inline-flex rounded-lg bg-white/15 p-2 text-white">
        <Icon size={18} />
      </div>
      <p className="text-sm text-blue-100/80">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
      <p className="mt-1 text-xs text-blue-200/80">{helper}</p>
    </article>
  );
};
