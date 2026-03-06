import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCcw, Share2, Printer, X } from "lucide-react";
import { PaginationControls } from "../common/PaginationControls";
import { CAMPAIGN_OPTIONS } from "../../data/form-options";
import { printDonationReceipt, shareDonationReceipt } from "../../services/receipt";
import { formatCurrency } from "../../utils/currency";
import { DonationForm } from "../donations/DonationForm";
import { DonationTable } from "../donations/DonationTable";
import type { Donation, DonationFilters, DonationInput } from "../../types/donation";
import type { Contributor } from "../../types/contributor";
const PAGE_SIZE = 10;

interface CollectionViewProps {
  filters: DonationFilters;
  onChangeFilters: (filters: DonationFilters) => void;
  donations: Donation[];
  contributors: Contributor[];
  loading: boolean;
  submitting: boolean;
  activeReceiptId: string | null;
  onSubmit: (payload: DonationInput) => Promise<Donation>;
  onDownloadReceipt: (donation: Donation) => void;
  onEmailReceipt: (donation: Donation) => void;
  onRefresh: () => Promise<void>;
  onContributorCreated: () => Promise<void>;
}

export const CollectionView = ({
  filters,
  onChangeFilters,
  donations,
  contributors,
  loading,
  submitting,
  activeReceiptId,
  onSubmit,
  onDownloadReceipt,
  onEmailReceipt,
  onRefresh,
  onContributorCreated,
}: CollectionViewProps) => {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);
  const [sharingReceipt, setSharingReceipt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recentDonation = donations[0] ?? null;
  const totalPages = Math.max(1, Math.ceil(donations.length / PAGE_SIZE));
  const paginatedDonations = useMemo(
    () => donations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [donations, currentPage],
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const closeModal = () => {
    if (submitting || sharingReceipt) {
      return;
    }
    setShowDonationModal(false);
    setCreatedDonation(null);
  };

  const openModal = () => {
    setCreatedDonation(null);
    setShowDonationModal(true);
  };

  const handleShareReceipt = async () => {
    if (!createdDonation) {
      return;
    }

    try {
      setSharingReceipt(true);
      await shareDonationReceipt(createdDonation);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not share receipt.");
    } finally {
      setSharingReceipt(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!createdDonation) {
      return;
    }

    try {
      await printDonationReceipt(createdDonation);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not print receipt.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="tf-page-header">
        <h1 className="tf-page-title">Collection</h1>
        <p className="tf-page-subtitle">Create and track donation entries.</p>
      </div>

      <button className="tf-btn-purple" type="button" onClick={openModal}>
        Add Donation
      </button>

      {showDonationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-slate-900/45" />
          <div
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--tf-navy)]">
                  {createdDonation ? "Donation Saved" : "Add Donation"}
                </h2>
                <p className="text-sm text-slate-500">
                  {createdDonation
                    ? "Receipt actions are now available."
                    : "Fill details and submit to create a donation entry."}
                </p>
              </div>
              <button
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
                type="button"
                onClick={closeModal}
                disabled={submitting || sharingReceipt}
                aria-label="Close donation popup"
              >
                <X size={18} />
              </button>
            </div>

            {createdDonation ? (
              <div className="grid gap-4">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                  <CheckCircle2 size={64} className="text-emerald-600" />
                  <p className="mt-3 text-lg font-semibold text-emerald-700">Donation added successfully</p>
                  <p className="text-sm text-emerald-700/80">
                    {createdDonation.donorName} donated {formatCurrency(createdDonation.amount)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    className="tf-btn-outline justify-center"
                    type="button"
                    onClick={() => void handlePrintReceipt()}
                  >
                    <Printer size={16} />
                    Print Receipt
                  </button>
                  <button
                    className="tf-btn-outline justify-center"
                    type="button"
                    onClick={() => void handleShareReceipt()}
                    disabled={sharingReceipt}
                  >
                    <Share2 size={16} />
                    {sharingReceipt ? "Sharing..." : "Share PDF"}
                  </button>
                  <button className="tf-btn-purple justify-center" type="button" onClick={closeModal}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <DonationForm
                loading={submitting}
                onSubmit={onSubmit}
                contributors={contributors}
                onSaved={(donation) => setCreatedDonation(donation)}
                onContributorCreated={onContributorCreated}
                compact
              />
            )}
          </div>
        </div>
      )}

      <article className="tf-section-card">
        <div className="mb-4 rounded-xl border border-[#dce6f5] bg-[#f7faff] p-3">
          <h3 className="text-sm font-semibold text-[var(--tf-navy)]">Recent Donation</h3>
          {recentDonation ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <p className="font-semibold text-[var(--tf-navy)]">{recentDonation.donorName}</p>
              <p className="text-slate-600">{formatCurrency(recentDonation.amount)}</p>
              <p className="max-w-[180px] truncate text-slate-500">{recentDonation.campaign}</p>
              <p className="text-slate-500">
                {new Date(recentDonation.donationDate).toLocaleString("en-IN")}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-slate-500">No donations available yet.</p>
          )}
        </div>

        <div className="mb-3 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[var(--tf-navy)]">Donation Records</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="tf-input"
              type="text"
              placeholder="Search donor name/email"
              value={filters.search ?? ""}
              onChange={(event) => {
                setCurrentPage(1);
                onChangeFilters({ ...filters, search: event.target.value || undefined });
              }}
            />
            <select
              className="tf-input"
              value={filters.campaign ?? "All campaigns"}
              onChange={(event) => {
                setCurrentPage(1);
                onChangeFilters({
                  ...filters,
                  campaign: event.target.value === "All campaigns" ? undefined : event.target.value,
                });
              }}
            >
              <option>All campaigns</option>
              {CAMPAIGN_OPTIONS.map((campaign) => (
                <option key={campaign} value={campaign}>
                  {campaign}
                </option>
              ))}
            </select>
            <button className="tf-btn-outline" type="button" onClick={() => void onRefresh()}>
              <RefreshCcw size={15} />
              Refresh
            </button>
          </div>
        </div>

        <DonationTable
          loading={loading}
          donations={paginatedDonations}
          activeReceiptId={activeReceiptId}
          onDownloadReceipt={onDownloadReceipt}
          onEmailReceipt={onEmailReceipt}
        />
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={donations.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </article>
    </section>
  );
};
