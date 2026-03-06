import { useEffect, useMemo, useRef, useState } from "react";
import {
  ContactRound,
  Eye,
  Mail,
  MapPinHouse,
  Pencil,
  Phone,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import type { Contributor, ContributorInput } from "../../types/contributor";
import type { Donation } from "../../types/donation";
import { PaginationControls } from "../common/PaginationControls";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

interface ContributorsViewProps {
  contributors: Contributor[];
  donations: Donation[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onSearch: (value?: string) => Promise<void>;
  onCreateContributor: (payload: ContributorInput) => Promise<void>;
  onUpdateContributor: (id: string, payload: ContributorInput) => Promise<void>;
  onDeleteContributor: (id: string) => Promise<void>;
}

interface ContributorModalProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  formData: ContributorInput;
  error?: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: <K extends keyof ContributorInput>(key: K, value: ContributorInput[K]) => void;
}

const initialFormState: ContributorInput = {
  name: "",
  phoneNo: "",
  email: "",
  address: "",
};
const PAGE_SIZE = 10;
const DONATION_STATS_PAGE_SIZE = 10;

const ContributorModal = ({
  title,
  subtitle,
  submitLabel,
  formData,
  error,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: ContributorModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    onClick={() => {
      if (!submitting) {
        onClose();
      }
    }}
  >
    <div className="absolute inset-0 bg-slate-900/45" />
    <form
      className="relative z-10 grid max-h-[90vh] w-full max-w-xl gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
      onSubmit={(event) => onSubmit(event)}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--tf-navy)]">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button
          className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label={`Close ${title}`}
        >
          <X size={16} />
        </button>
      </div>
      <input
        className="tf-input"
        type="text"
        placeholder="Name"
        required
        minLength={2}
        maxLength={120}
        value={formData.name}
        onChange={(event) => onChange("name", event.target.value)}
      />
      <input
        className="tf-input"
        type="text"
        placeholder="Phone No. (Optional)"
        minLength={7}
        maxLength={20}
        value={formData.phoneNo ?? ""}
        onChange={(event) => onChange("phoneNo", event.target.value)}
      />
      <input
        className="tf-input"
        type="email"
        placeholder="Email (Optional)"
        value={formData.email ?? ""}
        onChange={(event) => onChange("email", event.target.value)}
      />
      <textarea
        className="tf-input min-h-[86px] resize-y"
        placeholder="Address (Optional)"
        minLength={3}
        maxLength={250}
        value={formData.address ?? ""}
        onChange={(event) => onChange("address", event.target.value)}
      />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="tf-btn-purple" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button className="tf-btn-outline" type="button" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  </div>
);

export const ContributorsView = ({
  contributors,
  donations,
  loading,
  submitting,
  error,
  onSearch,
  onCreateContributor,
  onUpdateContributor,
  onDeleteContributor,
}: ContributorsViewProps) => {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingContributorId, setEditingContributorId] = useState<string | null>(null);
  const [editingContributorCode, setEditingContributorCode] = useState("");
  const [editFormData, setEditFormData] = useState(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [donationStatsContributor, setDonationStatsContributor] = useState<Contributor | null>(null);
  const [donationStatsPage, setDonationStatsPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const hasMountedSearchRef = useRef(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  const filteredContributors = useMemo(
    () =>
      contributors.filter((contributor) => {
        const keyword = search.trim().toLowerCase();
        return (
          !keyword ||
          contributor.name.toLowerCase().includes(keyword) ||
          (contributor.phoneNo ?? "").toLowerCase().includes(keyword) ||
          contributor.email?.toLowerCase().includes(keyword) ||
          contributor.contributorId.toLowerCase().includes(keyword)
        );
      }),
    [contributors, search],
  );
  const totalPages = Math.max(1, Math.ceil(filteredContributors.length / PAGE_SIZE));
  const paginatedContributors = useMemo(
    () =>
      filteredContributors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredContributors, currentPage],
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

  const updateField = <K extends keyof ContributorInput>(key: K, value: ContributorInput[K]) => {
    setFormError(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateEditField = <K extends keyof ContributorInput>(
    key: K,
    value: ContributorInput[K],
  ) => {
    setFormError(null);
    setEditFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextPayload: ContributorInput = {
      name: formData.name.trim(),
      phoneNo: (formData.phoneNo ?? "").trim(),
      email: (formData.email ?? "").trim() || undefined,
      address: (formData.address ?? "").trim(),
    };
    if (!nextPayload.name) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    await onCreateContributor({
      ...nextPayload,
    });
    setFormData(initialFormState);
    setShowAddModal(false);
  };

  const startEdit = (contributor: Contributor) => {
    setShowAddModal(false);
    setEditingContributorId(contributor._id);
    setEditingContributorCode(contributor.contributorId);
    setEditFormData({
      name: contributor.name,
      phoneNo: contributor.phoneNo ?? "",
      email: contributor.email ?? "",
      address: contributor.address ?? "",
    });
    setFormError(null);
  };

  const cancelEdit = () => {
    setEditingContributorId(null);
    setEditingContributorCode("");
    setEditFormData(initialFormState);
    setFormError(null);
  };

  const handleUpdateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingContributorId) {
      return;
    }
    const nextPayload: ContributorInput = {
      name: editFormData.name.trim(),
      phoneNo: (editFormData.phoneNo ?? "").trim(),
      email: (editFormData.email ?? "").trim() || undefined,
      address: (editFormData.address ?? "").trim(),
    };
    if (!nextPayload.name) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    await onUpdateContributor(editingContributorId, {
      ...nextPayload,
    });
    cancelEdit();
  };

  const handleDelete = async (contributor: Contributor) => {
    const confirmed = window.confirm(
      `Delete contributor ${contributor.name} (${contributor.contributorId})?`,
    );
    if (!confirmed) {
      return;
    }

    await onDeleteContributor(contributor._id);
    if (editingContributorId === contributor._id) {
      cancelEdit();
    }
  };

  const selectedContributorDonations = useMemo(() => {
    if (!donationStatsContributor) {
      return [];
    }

    const contributorName = donationStatsContributor.name.trim().toLowerCase();
    return donations.filter((donation) => {
      if (donation.contributorId) {
        return donation.contributorId === donationStatsContributor._id;
      }
      return donation.donorName.trim().toLowerCase() === contributorName;
    });
  }, [donationStatsContributor, donations]);

  const selectedContributorTotal = useMemo(
    () => selectedContributorDonations.reduce((sum, donation) => sum + donation.amount, 0),
    [selectedContributorDonations],
  );
  const sortedSelectedContributorDonations = useMemo(
    () =>
      selectedContributorDonations
        .slice()
        .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()),
    [selectedContributorDonations],
  );
  const donationStatsTotalPages = Math.max(
    1,
    Math.ceil(sortedSelectedContributorDonations.length / DONATION_STATS_PAGE_SIZE),
  );
  const paginatedDonationStats = useMemo(
    () =>
      sortedSelectedContributorDonations.slice(
        (donationStatsPage - 1) * DONATION_STATS_PAGE_SIZE,
        donationStatsPage * DONATION_STATS_PAGE_SIZE,
      ),
    [sortedSelectedContributorDonations, donationStatsPage],
  );

  useEffect(() => {
    setDonationStatsPage((prev) => Math.min(prev, donationStatsTotalPages));
  }, [donationStatsTotalPages]);

  return (
    <section className="space-y-5">
      <div className="tf-page-header">
        <h1 className="tf-page-title">Contributors</h1>
        <p className="tf-page-subtitle">
          Manage {filteredContributors.length} registered contributors
        </p>
      </div>

      <button
        className="tf-btn-purple"
        type="button"
        onClick={() => {
          cancelEdit();
          setFormData(initialFormState);
          setShowAddModal(true);
        }}
      >
        <UserPlus size={16} />
        Add Contributor
      </button>

      <div className="space-y-2.5">
        <label className="tf-input-wrap">
          <Search size={16} className="text-slate-400" />
          <input
            className="tf-input-clean"
            type="text"
            placeholder="Search by name, mobile, or box ID..."
            value={search}
            onChange={(event) => {
              setCurrentPage(1);
              setSearch(event.target.value);
            }}
          />
        </label>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading contributors...</p>}

        {paginatedContributors.map((contributor) => (
          <article className="tf-contributor-card" key={contributor._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="tf-initial-badge shrink-0">{contributor.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-[var(--tf-navy)]">{contributor.name}</p>
                    <span className="tf-status-pill tf-status-active">Active</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Phone size={13} />
                      {contributor.phoneNo || "N/A"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ContactRound size={13} />
                      {contributor.contributorId}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail size={13} />
                      {contributor.email || "N/A"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPinHouse size={13} />
                      <span className="break-words">{contributor.address || "N/A"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <button
                  className="hover:text-[var(--tf-purple)]"
                  type="button"
                  onClick={() => startEdit(contributor)}
                  disabled={submitting}
                  aria-label={`Edit ${contributor.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="hover:text-red-500"
                  type="button"
                  onClick={() => void handleDelete(contributor)}
                  disabled={submitting}
                  aria-label={`Delete ${contributor.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-[0.08em] text-[var(--tf-navy-soft)]">
                ID: {contributor.contributorId}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">
                  Added: {formatDate(contributor.createdAt, "dd MMM yyyy")}
                </p>
                <button
                  className="inline-grid h-8 w-8 place-items-center rounded-lg border border-[#d3ddec] text-slate-600 transition hover:bg-[#eef4fb]"
                  type="button"
                  onClick={() => {
                    setDonationStatsPage(1);
                    setDonationStatsContributor(contributor);
                  }}
                  aria-label={`Show donations for ${contributor.name}`}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && !filteredContributors.length && (
          <p className="tf-section-card text-center text-sm text-slate-500">No contributors found.</p>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredContributors.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {showAddModal && (
        <ContributorModal
          title="Add Contributor"
          submitLabel="Save Contributor"
          formData={formData}
          error={formError}
          submitting={submitting}
          onClose={() => {
            setShowAddModal(false);
            setFormError(null);
          }}
          onSubmit={(event) => void handleSubmit(event)}
          onChange={updateField}
        />
      )}

      {editingContributorId && (
        <ContributorModal
          title="Edit Contributor"
          subtitle={`Contributor ID: ${editingContributorCode}`}
          submitLabel="Save Changes"
          formData={editFormData}
          error={formError}
          submitting={submitting}
          onClose={cancelEdit}
          onSubmit={(event) => void handleUpdateSubmit(event)}
          onChange={updateEditField}
        />
      )}

      {donationStatsContributor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setDonationStatsContributor(null);
            setDonationStatsPage(1);
          }}
        >
          <div className="absolute inset-0 bg-slate-900/45" />
          <div
            className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--tf-navy)]">
                  {donationStatsContributor.name} - Donations
                </h2>
                <p className="text-sm text-slate-500">{donationStatsContributor.contributorId}</p>
              </div>
              <button
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100"
                type="button"
                onClick={() => {
                  setDonationStatsContributor(null);
                  setDonationStatsPage(1);
                }}
                aria-label="Close donation stats"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#dce6f5] bg-[#f7faff] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Times Donated
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--tf-navy)]">
                  {selectedContributorDonations.length}
                </p>
              </div>
              <div className="rounded-xl border border-[#dce6f5] bg-[#f7faff] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Total Donated
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--tf-navy)]">
                  {formatCurrency(selectedContributorTotal)}
                </p>
              </div>
            </div>

            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {selectedContributorDonations.length ? (
                paginatedDonationStats.map((donation) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-[var(--tf-border)] bg-white px-3 py-2"
                      key={donation._id}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--tf-navy)]">
                          {formatCurrency(donation.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(donation.donationDate, "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{donation.campaign}</p>
                    </div>
                  ))
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--tf-border)] bg-[#fafcff] px-3 py-8 text-center text-sm text-slate-500">
                  No donations found for this contributor.
                </p>
              )}
            </div>

            <PaginationControls
              currentPage={donationStatsPage}
              totalPages={donationStatsTotalPages}
              totalItems={sortedSelectedContributorDonations.length}
              pageSize={DONATION_STATS_PAGE_SIZE}
              onPageChange={setDonationStatsPage}
            />
          </div>
        </div>
      )}
    </section>
  );
};
