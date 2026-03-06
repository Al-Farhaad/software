import { useMemo, useState } from "react";
import { ArrowRight, HandCoins, IndianRupee, Landmark, Plus, UsersRound } from "lucide-react";
import { MetricCard } from "../common/MetricCard";
import { AnalyticsFilterBar } from "../common/AnalyticsFilterBar";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import type { Donation } from "../../types/donation";
import type { Investment } from "../../types/investment";
import {
  analyticsFilterLabel,
  defaultAnalyticsDate,
  filterByAnalyticsRange,
  type AnalyticsFilterType,
} from "../../utils/analytics-filter";

interface DashboardViewProps {
  donations: Donation[];
  investments: Investment[];
  onCreateCollection: () => void;
  onViewContributors: () => void;
}

export const DashboardView = ({
  donations,
  investments,
  onCreateCollection,
  onViewContributors,
}: DashboardViewProps) => {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
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
  const recent = filteredDonations.slice(0, 3);
  const recentInvestments = filteredInvestments.slice(0, 3);

  const contributorLeaderboard = useMemo(() => {
    const grouped = filteredDonations.reduce<
      Map<
        string,
        {
          contributorKey: string;
          donorName: string;
          donorInfo: string;
          totalAmount: number;
          donationCount: number;
          lastDonationDate: string;
        }
      >
    >((acc, donation) => {
      const key = donation.contributorId || donation.donorName.trim().toLowerCase();
      const current = acc.get(key);

      if (current) {
        current.totalAmount += donation.amount;
        current.donationCount += 1;
        if (new Date(donation.donationDate) > new Date(current.lastDonationDate)) {
          current.lastDonationDate = donation.donationDate;
        }
        return acc;
      }

      acc.set(key, {
        contributorKey: key,
        donorName: donation.donorName,
        donorInfo: donation.donorEmail || donation.donorPhone || "N/A",
        totalAmount: donation.amount,
        donationCount: 1,
        lastDonationDate: donation.donationDate,
      });
      return acc;
    }, new Map());

    return Array.from(grouped.values()).sort((a, b) =>
      sortOrder === "desc" ? b.totalAmount - a.totalAmount : a.totalAmount - b.totalAmount,
    );
  }, [filteredDonations, sortOrder]);

  const uniqueContributors = contributorLeaderboard.length;
  const totalDonations = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const totalInvested = filteredInvestments.reduce(
    (sum, investment) => sum + investment.amountInvested,
    0,
  );
  const remainingAmount = totalDonations - totalInvested;
  const activeRangeLabel = analyticsFilterLabel(filterType, selectedDate);

  return (
    <section className="min-w-0 space-y-4">
      <article className="tf-hero-card">
        <p className="text-xs font-semibold text-white/85">Bismillahi Ar-Rahman Ar-Raheem</p>
        <h1 className="mt-3 break-words text-2xl font-bold leading-tight text-white">
          <span className="block">Taba Foundation for</span>
          <span className="mt-1.5 block">Bright Future</span>
        </h1>
        <p className="mt-3 text-sm text-white/85">Sadaqah Jaariyah Fund Management System</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button className="tf-action-button" type="button" onClick={onCreateCollection}>
            <Plus size={15} />
            New Collection
          </button>
          <button className="tf-action-link" type="button" onClick={onViewContributors}>
            <UsersRound size={15} />
            View Contributors
          </button>
        </div>
      </article>

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
          helper={activeRangeLabel}
          icon={HandCoins}
          variant="purple"
        />
        <MetricCard
          title="Total Contributors"
          value={uniqueContributors}
          helper={`In ${activeRangeLabel}`}
          icon={UsersRound}
        />
        <MetricCard
          title="Invested"
          value={formatCurrency(totalInvested)}
          helper={`In ${activeRangeLabel}`}
          icon={Landmark}
          variant="amber"
        />
        <MetricCard
          title="Amount Remaining"
          value={formatCurrency(remainingAmount)}
          helper={`In ${activeRangeLabel}`}
          icon={IndianRupee}
        />
      </div>

      <article className="tf-section-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tf-navy)]">Recent Collections</h2>
          <button className="shrink-0 text-sm font-semibold text-[var(--tf-purple)]" type="button">
            View All <ArrowRight className="inline" size={14} />
          </button>
        </div>
        <div className="space-y-2.5">
          {recent.map((donation) => (
            <div key={donation._id} className="tf-collection-row">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="tf-initial-badge">{donation.donorName.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--tf-navy)]">{donation.donorName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {formatDate(donation.donationDate, "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[var(--tf-navy)]">
                  {formatCurrency(donation.amount)}
                </p>
                <p className="truncate text-xs text-slate-500">{donation.paymentMethod.replace("_", " ")}</p>
              </div>
            </div>
          ))}
          {!recent.length && (
            <p className="rounded-xl bg-[#f5f1fd] px-4 py-6 text-center text-sm text-slate-500">
              No collections available.
            </p>
          )}
        </div>
      </article>

      <article className="tf-section-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tf-navy)]">Recent Investments</h2>
        </div>
        <div className="space-y-2.5">
          {recentInvestments.map((investment) => (
            <div key={investment._id} className="tf-collection-row">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="tf-initial-badge">
                  {investment.nameWhereInvested.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--tf-navy)]">
                    {investment.nameWhereInvested}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {formatDate(investment.investedAt || investment.createdAt, "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
              <div className="min-w-0 shrink-0 text-right">
                <p className="text-sm font-semibold text-[var(--tf-navy)]">
                  {formatCurrency(investment.amountInvested)}
                </p>
                <p className="max-w-[112px] truncate text-xs text-slate-500 sm:max-w-[170px]">
                  {investment.note?.trim() || "No note"}
                </p>
              </div>
            </div>
          ))}
          {!recentInvestments.length && (
            <p className="rounded-xl bg-[#f5f1fd] px-4 py-6 text-center text-sm text-slate-500">
              No investments available.
            </p>
          )}
        </div>
      </article>

      <article className="tf-section-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tf-navy)]">Top Contributors</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">
              Sort
            </label>
            <select
              className="tf-input w-auto py-1.5 text-xs"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "desc" | "asc")}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {contributorLeaderboard.slice(0, 10).map((entry, index) => (
            <div key={entry.contributorKey} className="tf-collection-row">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="tf-initial-badge">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--tf-navy)]">{entry.donorName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {entry.donorInfo} | {entry.donationCount} donation
                    {entry.donationCount > 1 ? "s" : ""} | Last:{" "}
                    {formatDate(entry.lastDonationDate, "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--tf-purple)]">
                {formatCurrency(entry.totalAmount)}
              </p>
            </div>
          ))}

          {!contributorLeaderboard.length && (
            <p className="rounded-xl bg-[#f5f1fd] px-4 py-6 text-center text-sm text-slate-500">
              No contributor donation totals available yet.
            </p>
          )}
        </div>
      </article>
    </section>
  );
};
