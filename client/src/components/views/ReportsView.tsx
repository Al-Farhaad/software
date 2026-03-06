import { useMemo, useState } from "react";
import { addDays, eachDayOfInterval, endOfMonth, format, getMonth, startOfMonth, startOfWeek } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesColumn, Landmark, UsersRound, Wallet } from "lucide-react";
import { MetricCard } from "../common/MetricCard";
import { AnalyticsFilterBar } from "../common/AnalyticsFilterBar";
import type { Donation } from "../../types/donation";
import type { Investment } from "../../types/investment";
import { formatCurrency } from "../../utils/currency";
import {
  analyticsFilterLabel,
  defaultAnalyticsDate,
  filterByAnalyticsRange,
  type AnalyticsFilterType,
} from "../../utils/analytics-filter";

interface ReportsViewProps {
  donations: Donation[];
  investments: Investment[];
  loading: boolean;
}

type ReportTab = "trend" | "campaign" | "funds";

const CAMPAIGN_COLORS = ["#0b245c", "#12397f", "#1d4694", "#11844a", "#13a455", "#3ea95a"];

const keyFromDate = (date: Date) => format(date, "yyyy-MM-dd");

export const ReportsView = ({ donations, investments, loading }: ReportsViewProps) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("trend");
  const [filterType, setFilterType] = useState<AnalyticsFilterType>("monthly");
  const [selectedDate, setSelectedDate] = useState(defaultAnalyticsDate());

  const filteredDonations = useMemo(
    () => filterByAnalyticsRange(donations, (donation) => donation.donationDate, filterType, selectedDate),
    [donations, filterType, selectedDate],
  );
  const filteredInvestments = useMemo(
    () =>
      filterByAnalyticsRange(
        investments,
        (investment) => investment.investedAt || investment.createdAt,
        filterType,
        selectedDate,
      ),
    [investments, filterType, selectedDate],
  );

  const totalDonations = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalInvested = filteredInvestments.reduce(
    (sum, investment) => sum + investment.amountInvested,
    0,
  );
  const amountRemaining = totalDonations - totalInvested;
  const filterLabel = analyticsFilterLabel(filterType, selectedDate);

  const filteredContributorsCount = useMemo(
    () =>
      new Set(
        filteredDonations.map((donation) => donation.contributorId || donation.donorName.trim().toLowerCase()),
      ).size,
    [filteredDonations],
  );

  const trendData = useMemo(() => {
    const anchor = new Date(`${selectedDate}T12:00:00`);

    if (filterType === "yearly") {
      return Array.from({ length: 12 }).map((_, monthIndex) => {
        const donationValue = filteredDonations
          .filter((donation) => getMonth(new Date(donation.donationDate)) === monthIndex)
          .reduce((sum, donation) => sum + donation.amount, 0);
        const investmentValue = filteredInvestments
          .filter((investment) => getMonth(new Date(investment.investedAt || investment.createdAt)) === monthIndex)
          .reduce((sum, investment) => sum + investment.amountInvested, 0);

        return {
          month: format(new Date(anchor.getFullYear(), monthIndex, 1), "MMM"),
          donations: donationValue,
          investments: investmentValue,
          remaining: donationValue - investmentValue,
        };
      });
    }

    if (filterType === "weekly") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const donationByDay = filteredDonations.reduce<Record<string, number>>((acc, donation) => {
        const key = keyFromDate(new Date(donation.donationDate));
        acc[key] = (acc[key] ?? 0) + donation.amount;
        return acc;
      }, {});
      const investmentByDay = filteredInvestments.reduce<Record<string, number>>((acc, investment) => {
        const key = keyFromDate(new Date(investment.investedAt || investment.createdAt));
        acc[key] = (acc[key] ?? 0) + investment.amountInvested;
        return acc;
      }, {});

      return Array.from({ length: 7 }).map((_, index) => {
        const day = addDays(start, index);
        const key = keyFromDate(day);
        const donationValue = donationByDay[key] ?? 0;
        const investmentValue = investmentByDay[key] ?? 0;

        return {
          month: format(day, "EEE"),
          donations: donationValue,
          investments: investmentValue,
          remaining: donationValue - investmentValue,
        };
      });
    }

    if (filterType === "day") {
      return [
        {
          month: format(anchor, "dd MMM"),
          donations: totalDonations,
          investments: totalInvested,
          remaining: amountRemaining,
        },
      ];
    }

    const monthStart = startOfMonth(anchor);
    const monthEnd = endOfMonth(anchor);
    const donationByDay = filteredDonations.reduce<Record<string, number>>((acc, donation) => {
      const key = keyFromDate(new Date(donation.donationDate));
      acc[key] = (acc[key] ?? 0) + donation.amount;
      return acc;
    }, {});
    const investmentByDay = filteredInvestments.reduce<Record<string, number>>((acc, investment) => {
      const key = keyFromDate(new Date(investment.investedAt || investment.createdAt));
      acc[key] = (acc[key] ?? 0) + investment.amountInvested;
      return acc;
    }, {});

    return eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => {
      const key = keyFromDate(day);
      const donationValue = donationByDay[key] ?? 0;
      const investmentValue = investmentByDay[key] ?? 0;
      return {
        month: format(day, "d"),
        donations: donationValue,
        investments: investmentValue,
        remaining: donationValue - investmentValue,
      };
    });
  }, [
    amountRemaining,
    filterType,
    filteredDonations,
    filteredInvestments,
    selectedDate,
    totalDonations,
    totalInvested,
  ]);

  const campaignData = useMemo(() => {
    const campaignTotals = filteredDonations.reduce<Record<string, number>>((acc, donation) => {
      acc[donation.campaign] = (acc[donation.campaign] ?? 0) + donation.amount;
      return acc;
    }, {});

    return Object.entries(campaignTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredDonations]);

  const fundData = useMemo(
    () => [
      { label: "Donations", amount: totalDonations },
      { label: "Invested", amount: totalInvested },
      { label: "Remaining", amount: amountRemaining },
    ],
    [totalDonations, totalInvested, amountRemaining],
  );

  return (
    <section className="space-y-5">
      <div className="tf-page-header">
        <h1 className="tf-page-title">Reports &amp; Analytics</h1>
        <p className="tf-page-subtitle">Live graphs from donation and investment records</p>
      </div>

      <AnalyticsFilterBar
        filterType={filterType}
        selectedDate={selectedDate}
        onFilterTypeChange={setFilterType}
        onDateChange={setSelectedDate}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          title="Total Donations"
          value={formatCurrency(totalDonations)}
          helper={filterLabel}
          icon={ChartNoAxesColumn}
          variant="purple"
        />
        <MetricCard
          title="Total Invested"
          value={formatCurrency(totalInvested)}
          helper={filterLabel}
          icon={Landmark}
          variant="amber"
        />
        <MetricCard
          title="Amount Remaining"
          value={formatCurrency(amountRemaining)}
          helper={filterLabel}
          icon={Wallet}
        />
        <MetricCard
          title="Total Contributors"
          value={filteredContributorsCount}
          helper={`In ${filterLabel}`}
          icon={UsersRound}
        />
      </div>

      <div className="tf-tab-strip">
        <button
          className={activeTab === "trend" ? "tf-tab-strip-active" : ""}
          type="button"
          onClick={() => setActiveTab("trend")}
        >
          Trend
        </button>
        <button
          className={activeTab === "campaign" ? "tf-tab-strip-active" : ""}
          type="button"
          onClick={() => setActiveTab("campaign")}
        >
          Campaigns
        </button>
        <button
          className={activeTab === "funds" ? "tf-tab-strip-active" : ""}
          type="button"
          onClick={() => setActiveTab("funds")}
        >
          Funds
        </button>
      </div>

      <article className="tf-section-card">
        {loading ? <p className="text-sm text-slate-500">Loading analytics...</p> : null}

        {!loading && activeTab === "trend" && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-[var(--tf-navy)]">
              Donation vs Investment Trend ({filterLabel})
            </h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 4, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#dce6f8" />
                  <XAxis dataKey="month" tick={{ fill: "#606886", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#606886", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #dce6f8",
                      background: "#fff",
                      color: "#1f275e",
                    }}
                    formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                  />
                  <Legend />
                  <Bar dataKey="donations" fill="#0b245c" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="investments" fill="#11844a" radius={[5, 5, 0, 0]} />
                  <Line type="monotone" dataKey="remaining" stroke="#12397f" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {!loading && activeTab === "campaign" && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-[var(--tf-navy)]">
              Campaign Contribution Split ({filterLabel})
            </h2>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={campaignData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {campaignData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${entry.value}`}
                          fill={CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {campaignData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: CAMPAIGN_COLORS[index % CAMPAIGN_COLORS.length] }}
                    />
                    <span className="max-w-[180px] truncate">{entry.name}</span>
                    <span className="ml-auto font-semibold text-[var(--tf-navy)]">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
                {!campaignData.length && (
                  <p className="text-sm text-slate-500">No campaign data yet.</p>
                )}
              </div>
            </div>
          </>
        )}

        {!loading && activeTab === "funds" && (
          <>
            <h2 className="mb-4 text-lg font-semibold text-[var(--tf-navy)]">
              Fund Allocation Overview ({filterLabel})
            </h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundData} margin={{ top: 4, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#dce6f8" />
                  <XAxis dataKey="label" tick={{ fill: "#606886", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#606886", fontSize: 12 }} />
                  <Tooltip formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))} />
                  <Bar dataKey="amount" radius={[7, 7, 0, 0]}>
                    <Cell fill="#0b245c" />
                    <Cell fill="#11844a" />
                    <Cell fill="#12397f" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </article>
    </section>
  );
};
