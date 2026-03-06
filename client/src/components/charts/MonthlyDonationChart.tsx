import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyTotal } from "../../types/donation";
import { formatCurrency } from "../../utils/currency";

interface MonthlyDonationChartProps {
  data: MonthlyTotal[];
  loading: boolean;
}

export const MonthlyDonationChart = ({ data, loading }: MonthlyDonationChartProps) => (
  <article className="panel h-[340px]">
    <h3 className="mb-4 text-lg font-semibold text-white">Monthly Collection</h3>
    {loading ? (
      <p className="text-sm text-blue-100/80">Loading chart...</p>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.16)" />
          <XAxis dataKey="month" angle={-28} textAnchor="end" stroke="#d5e1ff" height={55} />
          <YAxis
            stroke="#d5e1ff"
            tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
            width={54}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.08)" }}
            contentStyle={{
              backgroundColor: "#07122a",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              color: "white",
            }}
            formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
          />
          <Bar dataKey="total" fill="#d5e1ff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </article>
);
