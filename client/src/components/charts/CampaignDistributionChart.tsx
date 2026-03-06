import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CampaignTotal } from "../../types/donation";
import { formatCurrency } from "../../utils/currency";

interface CampaignDistributionChartProps {
  data: CampaignTotal[];
  loading: boolean;
}

const PIE_COLORS = ["#d5e1ff", "#8ca9f9", "#6183df", "#496bc7", "#2f53af", "#1f3d8c"];

export const CampaignDistributionChart = ({ data, loading }: CampaignDistributionChartProps) => (
  <article className="panel h-[340px]">
    <h3 className="mb-4 text-lg font-semibold text-white">Campaign Distribution</h3>
    {loading ? (
      <p className="text-sm text-blue-100/80">Loading chart...</p>
    ) : (
      <div className="grid h-full gap-4 md:grid-cols-[1fr_auto]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="campaign"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={48}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.campaign}-${entry.total}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#07122a",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12,
                color: "white",
              }}
              formatter={(value: number | string | undefined) =>
                formatCurrency(Number(value ?? 0))
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <ul className="space-y-2 text-sm">
          {data.map((item, index) => (
            <li key={item.campaign} className="flex items-center gap-2 text-blue-100">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span>{item.campaign}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </article>
);
