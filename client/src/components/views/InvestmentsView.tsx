import { useEffect, useMemo, useRef, useState } from "react";
import { Landmark, Pencil, Search, Trash2, X } from "lucide-react";
import { AnalyticsFilterBar } from "../common/AnalyticsFilterBar";
import { PaginationControls } from "../common/PaginationControls";
import type { Investment, InvestmentInput } from "../../types/investment";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import {
  analyticsFilterLabel,
  defaultAnalyticsDate,
  filterByAnalyticsRange,
  type AnalyticsFilterType,
} from "../../utils/analytics-filter";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface InvestmentsViewProps {
  investments: Investment[];
  totalInvested: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onSearch: (value?: string) => Promise<void>;
  onCreateInvestment: (payload: InvestmentInput) => Promise<void>;
  onUpdateInvestment: (id: string, payload: InvestmentInput) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
}

const initialFormState: InvestmentInput = {
  nameWhereInvested: "",
  amountInvested: 0,
  note: "",
};
const PAGE_SIZE = 10;

export const InvestmentsView = ({
  investments,
  totalInvested,
  loading,
  submitting,
  error,
  onSearch,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
}: InvestmentsViewProps) => {
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<InvestmentInput>(initialFormState);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<InvestmentInput>(initialFormState);
  const [filterType, setFilterType] = useState<AnalyticsFilterType>("monthly");
  const [selectedDate, setSelectedDate] = useState(defaultAnalyticsDate());
  const [currentPage, setCurrentPage] = useState(1);
  const hasMountedSearchRef = useRef(false);
  const debouncedSearch = useDebouncedValue(search, 300);

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
  const filteredTotalInvested = useMemo(
    () => filteredInvestments.reduce((sum, investment) => sum + investment.amountInvested, 0),
    [filteredInvestments],
  );
  const filterLabel = analyticsFilterLabel(filterType, selectedDate);
  const totalPages = Math.max(1, Math.ceil(filteredInvestments.length / PAGE_SIZE));
  const paginatedInvestments = useMemo(
    () =>
      filteredInvestments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredInvestments, currentPage],
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!hasMountedSearchRef.current) {
      hasMountedSearchRef.current = true;
      return;
    }
    void onSearch(debouncedSearch.trim() || undefined);
  }, [debouncedSearch, onSearch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onCreateInvestment({
      ...formData,
      note: formData.note?.trim() ? formData.note.trim() : undefined,
    });
    setFormData(initialFormState);
  };

  const startEdit = (investment: Investment) => {
    setEditingInvestmentId(investment._id);
    setEditFormData({
      nameWhereInvested: investment.nameWhereInvested,
      amountInvested: investment.amountInvested,
      note: investment.note ?? "",
      investedAt: investment.investedAt ? investment.investedAt.slice(0, 16) : undefined,
    });
  };

  const cancelEdit = () => {
    setEditingInvestmentId(null);
    setEditFormData(initialFormState);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingInvestmentId) {
      return;
    }

    await onUpdateInvestment(editingInvestmentId, {
      ...editFormData,
      note: editFormData.note?.trim() ? editFormData.note.trim() : undefined,
      investedAt: editFormData.investedAt || undefined,
    });
    cancelEdit();
  };

  const handleDelete = async (investment: Investment) => {
    const confirmed = window.confirm(
      `Delete investment "${investment.nameWhereInvested}" (${formatCurrency(investment.amountInvested)})?`,
    );
    if (!confirmed) {
      return;
    }

    await onDeleteInvestment(investment._id);
    if (editingInvestmentId === investment._id) {
      cancelEdit();
    }
  };

  return (
    <section className="space-y-5">
      <div className="tf-page-header">
        <h1 className="tf-page-title">Investments</h1>
        <p className="tf-page-subtitle">Track where donation funds are invested.</p>
      </div>

      <article
        className="tf-section-card"
        style={{ backgroundColor: "#ecfdf3", borderColor: "#a7f3d0" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">
          Total Invested ({filterLabel})
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-3xl font-bold text-[var(--tf-navy)]">{formatCurrency(filteredTotalInvested)}</p>
          <span className="tf-icon-pill">
            <Landmark size={16} />
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">All-time invested: {formatCurrency(totalInvested)}</p>
      </article>

      <AnalyticsFilterBar
        filterType={filterType}
        selectedDate={selectedDate}
        onFilterTypeChange={(value) => {
          setFilterType(value);
          setCurrentPage(1);
        }}
        onDateChange={setSelectedDate}
      />

      <form className="tf-section-card grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <h2 className="text-base font-semibold text-[var(--tf-navy)]">Add Investment</h2>
        <input
          className="tf-input"
          type="text"
          placeholder="Name where invested (e.g., Mosque Construction)"
          required
          value={formData.nameWhereInvested}
          onChange={(event) => setFormData((prev) => ({ ...prev, nameWhereInvested: event.target.value }))}
        />
        <input
          className="tf-input"
          type="number"
          min={1}
          step="0.01"
          placeholder="Amount invested"
          required
          value={formData.amountInvested || ""}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, amountInvested: Number(event.target.value) }))
          }
        />
        <textarea
          className="tf-input min-h-[82px] resize-y"
          placeholder="Note (optional)"
          value={formData.note ?? ""}
          onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))}
        />
        <button className="tf-btn-purple w-fit" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Investment"}
        </button>
      </form>

      <div className="space-y-2.5">
        <label className="tf-input-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            className="tf-input-clean"
            type="text"
            placeholder="Search investments"
            value={search}
            onChange={(event) => {
              setCurrentPage(1);
              setSearch(event.target.value);
            }}
          />
        </label>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading investments...</p>}

      <div className="space-y-2.5">
        {paginatedInvestments.map((investment) => (
          <article key={investment._id} className="tf-contributor-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--tf-navy)]">
                  {investment.nameWhereInvested}
                </p>
                <p className="text-xs text-slate-500">
                  Added on {formatDate(investment.investedAt || investment.createdAt, "dd MMM yyyy, hh:mm a")}
                </p>
                {investment.note && (
                  <p className="mt-1 text-xs text-slate-600">Note: {investment.note}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="shrink-0 text-sm font-semibold text-[var(--tf-purple)]">
                  {formatCurrency(investment.amountInvested)}
                </p>
                <div className="mt-2 flex justify-end gap-2 text-slate-400">
                  <button
                    className="hover:text-[var(--tf-purple)]"
                    type="button"
                    onClick={() => startEdit(investment)}
                    disabled={submitting}
                    aria-label={`Edit ${investment.nameWhereInvested}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="hover:text-red-500"
                    type="button"
                    onClick={() => void handleDelete(investment)}
                    disabled={submitting}
                    aria-label={`Delete ${investment.nameWhereInvested}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {!loading && !filteredInvestments.length && (
          <p className="tf-section-card text-center text-sm text-slate-500">
            No investments found for {filterLabel}.
          </p>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInvestments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {editingInvestmentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!submitting) {
              cancelEdit();
            }
          }}
        >
          <div className="absolute inset-0 bg-slate-900/45" />
          <form
            className="relative z-10 grid max-h-[90vh] w-full max-w-xl gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onSubmit={(event) => void handleEditSubmit(event)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--tf-navy)]">Edit Investment</h3>
              <button
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
                type="button"
                onClick={cancelEdit}
                disabled={submitting}
                aria-label="Close edit investment form"
              >
                <X size={16} />
              </button>
            </div>

            <input
              className="tf-input"
              type="text"
              required
              value={editFormData.nameWhereInvested}
              onChange={(event) =>
                setEditFormData((prev) => ({ ...prev, nameWhereInvested: event.target.value }))
              }
            />
            <input
              className="tf-input"
              type="number"
              min={1}
              step="0.01"
              required
              value={editFormData.amountInvested || ""}
              onChange={(event) =>
                setEditFormData((prev) => ({ ...prev, amountInvested: Number(event.target.value) }))
              }
            />
            <input
              className="tf-input"
              type="datetime-local"
              value={editFormData.investedAt ?? ""}
              onChange={(event) =>
                setEditFormData((prev) => ({ ...prev, investedAt: event.target.value || undefined }))
              }
            />
            <textarea
              className="tf-input min-h-[82px] resize-y"
              value={editFormData.note ?? ""}
              onChange={(event) =>
                setEditFormData((prev) => ({ ...prev, note: event.target.value }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <button className="tf-btn-purple" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button className="tf-btn-outline" type="button" onClick={cancelEdit} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
