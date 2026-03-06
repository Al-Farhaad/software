import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CAMPAIGN_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../../data/form-options";
import { contributorApi } from "../../services/api";
import type { Donation, DonationInput } from "../../types/donation";
import type { Contributor } from "../../types/contributor";

interface DonationFormProps {
  loading: boolean;
  contributors: Contributor[];
  onSubmit: (payload: DonationInput) => Promise<Donation>;
  onSaved?: (donation: Donation) => void;
  onContributorCreated?: () => Promise<void> | void;
  compact?: boolean;
}

const initialFormState: DonationInput = {
  contributorId: "",
  donorName: "",
  donorEmail: "",
  donorPhone: "",
  donorAddress: "",
  amount: 0,
  campaign: CAMPAIGN_OPTIONS[0],
  paymentMethod: "upi",
  donationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  notes: "",
};

export const DonationForm = ({
  loading,
  contributors,
  onSubmit,
  onSaved,
  onContributorCreated,
  compact = false,
}: DonationFormProps) => {
  const [formData, setFormData] = useState<DonationInput>(initialFormState);
  const [contributorQuery, setContributorQuery] = useState("");
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [contributorError, setContributorError] = useState<string | null>(null);
  const [creatingContributor, setCreatingContributor] = useState(false);

  const updateField = <K extends keyof DonationInput>(key: K, value: DonationInput[K]) => {
    setContributorError(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const contributorOptions = useMemo(() => {
    const query = contributorQuery.trim().toLowerCase();
    if (!query) {
      return contributors.slice(0, 8);
    }
    return contributors
      .filter(
        (contributor) =>
          contributor.name.toLowerCase().includes(query) ||
          contributor.contributorId.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [contributorQuery, contributors]);

  const selectContributor = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setContributorQuery(`${contributor.name} (${contributor.contributorId})`);
    setContributorError(null);

    setFormData((prev) => ({
      ...prev,
      contributorId: contributor._id,
      donorName: contributor.name,
      donorEmail: contributor.email || "",
      donorPhone: contributor.phoneNo || "",
      donorAddress: contributor.address || "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: DonationInput = {
      ...formData,
      donorName: formData.donorName.trim(),
      donorEmail: (formData.donorEmail ?? "").trim() || undefined,
      donorPhone: (formData.donorPhone ?? "").trim() || undefined,
      donorAddress: (formData.donorAddress ?? "").trim() || undefined,
      notes: (formData.notes ?? "").trim() || undefined,
    };

    if (
      !payload.donorName ||
      !payload.amount ||
      !payload.campaign ||
      !payload.paymentMethod ||
      !payload.donationDate
    ) {
      setContributorError("Donor name, amount, campaign, payment method, and date are required.");
      return;
    }

    try {
      setContributorError(null);
      let nextPayload = payload;

      if (!selectedContributor) {
        setCreatingContributor(true);
        const createdContributor = await contributorApi.createContributor({
          name: payload.donorName,
          email: payload.donorEmail,
          phoneNo: payload.donorPhone,
          address: payload.donorAddress,
        });
        nextPayload = {
          ...payload,
          contributorId: createdContributor._id,
          donorName: createdContributor.name,
          donorEmail: createdContributor.email || payload.donorEmail,
          donorPhone: createdContributor.phoneNo || payload.donorPhone,
          donorAddress: createdContributor.address || payload.donorAddress,
        };
        await onContributorCreated?.();
      }

      const createdDonation = await onSubmit(nextPayload);
      setFormData(initialFormState);
      setContributorQuery("");
      setSelectedContributor(null);
      setContributorError(null);
      onSaved?.(createdDonation);
    } catch (requestError) {
      setContributorError(
        requestError instanceof Error ? requestError.message : "Could not save donation.",
      );
    } finally {
      setCreatingContributor(false);
    }
  };

  const formContent = (
    <>
      <h2 className="mb-4 text-lg font-semibold text-[var(--tf-navy)]">Add Donation</h2>
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <div className="relative">
          <input
            className="tf-input"
            type="text"
            placeholder="Search contributor by name or ID"
            value={contributorQuery}
            onChange={(event) => {
              setContributorQuery(event.target.value);
              setSelectedContributor(null);
              setContributorError(null);
              setFormData((prev) => ({
                ...prev,
                contributorId: "",
                donorName: "",
                donorEmail: "",
                donorPhone: "",
                donorAddress: "",
              }));
            }}
          />
          {contributorOptions.length > 0 && contributorQuery && !selectedContributor && (
            <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#d3ddec] bg-white shadow-lg">
              {contributorOptions.map((contributor) => (
                <button
                  key={contributor._id}
                  className="block w-full px-3 py-2 text-left text-sm text-[var(--tf-navy)] hover:bg-[#eef4fb]"
                  type="button"
                  onClick={() => selectContributor(contributor)}
                >
                  <span className="font-semibold">{contributor.name}</span>{" "}
                  <span className="text-slate-500">({contributor.contributorId})</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedContributor && (
          <p className="text-xs text-slate-500">
            Selected: <span className="font-semibold text-[var(--tf-navy)]">{selectedContributor.name}</span>{" "}
            ({selectedContributor.contributorId})
          </p>
        )}
        {contributorError && <p className="text-sm text-rose-500">{contributorError}</p>}

        {!selectedContributor && (
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="tf-input"
              type="text"
              minLength={2}
              maxLength={100}
              placeholder="Donor Name"
              required
              value={formData.donorName}
              onChange={(event) => updateField("donorName", event.target.value)}
            />
            <input
              className="tf-input"
              type="email"
              placeholder="Donor Email"
              value={formData.donorEmail ?? ""}
              onChange={(event) => updateField("donorEmail", event.target.value)}
            />
            <input
              className="tf-input"
              type="text"
              minLength={7}
              maxLength={25}
              placeholder="Donor Phone"
              value={formData.donorPhone ?? ""}
              onChange={(event) => updateField("donorPhone", event.target.value)}
            />
            <textarea
              className="tf-input min-h-[84px] resize-y md:col-span-2"
              minLength={3}
              maxLength={250}
              placeholder="Donor Address"
              value={formData.donorAddress ?? ""}
              onChange={(event) => updateField("donorAddress", event.target.value)}
            />
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="tf-input"
            type="number"
            min={1}
            step="0.01"
            placeholder="Amount"
            required
            value={formData.amount || ""}
            onChange={(event) => updateField("amount", Number(event.target.value))}
          />
          <input
            className="tf-input"
            type="datetime-local"
            required
            value={formData.donationDate}
            onChange={(event) => updateField("donationDate", event.target.value)}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="tf-input"
            required
            value={formData.campaign}
            onChange={(event) => updateField("campaign", event.target.value)}
          >
            {CAMPAIGN_OPTIONS.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
          <select
            className="tf-input"
            required
            value={formData.paymentMethod}
            onChange={(event) =>
              updateField("paymentMethod", event.target.value as DonationInput["paymentMethod"])
            }
          >
            {PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          className="tf-input min-h-[84px] resize-y"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
        <button
          className="tf-btn-purple mt-2 justify-center"
          type="submit"
          disabled={loading || creatingContributor}
        >
          {loading || creatingContributor ? "Saving..." : "Save Donation"}
        </button>
      </form>
    </>
  );

  if (compact) {
    return formContent;
  }

  return <section className="tf-section-card">{formContent}</section>;
};
