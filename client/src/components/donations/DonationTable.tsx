import { Download, Mail } from "lucide-react";
import type { Donation } from "../../types/donation";
import { formatCurrency } from "../../utils/currency";
import { formatDate } from "../../utils/date";

interface DonationTableProps {
  donations: Donation[];
  loading: boolean;
  activeReceiptId: string | null;
  onDownloadReceipt: (donation: Donation) => void;
  onEmailReceipt: (donation: Donation) => void;
}

export const DonationTable = ({
  donations,
  loading,
  activeReceiptId,
  onDownloadReceipt,
  onEmailReceipt,
}: DonationTableProps) => {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading donation records...</p>;
  }

  if (!donations.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#ddd6f3] bg-[#faf8ff] px-4 py-10 text-center">
        <p className="text-sm text-slate-500">No donations yet. Add your first record to begin.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {donations.map((donation) => (
          <article key={donation._id} className="rounded-xl border border-[#e5def5] bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--tf-navy)]">{donation.donorName}</p>
                <p className="truncate text-xs text-slate-500">
                  {donation.donorEmail || donation.donorPhone || "N/A"}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--tf-purple)]">
                {formatCurrency(donation.amount)}
              </p>
            </div>

            <div className="mt-2 grid gap-1 text-xs text-slate-500">
              <p>Campaign: {donation.campaign}</p>
              <p>Date: {formatDate(donation.donationDate, "dd MMM yyyy, hh:mm a")}</p>
              <p>Payment: {donation.paymentMethod.replace("_", " ")}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-md border border-[#ddd6f3] px-2.5 py-1.5 text-xs text-slate-600 hover:bg-[#f5f1fd]"
                type="button"
                onClick={() => onDownloadReceipt(donation)}
              >
                <Download size={14} />
                PDF
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-md border border-[#ddd6f3] px-2.5 py-1.5 text-xs text-slate-600 hover:bg-[#f5f1fd] disabled:opacity-70"
                type="button"
                onClick={() => onEmailReceipt(donation)}
                disabled={activeReceiptId === donation._id}
              >
                <Mail size={14} />
                {activeReceiptId === donation._id ? "Sending..." : "Email"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-[#e5def5] bg-white md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f5f1fd] text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation._id} className="border-t border-[#eee8fa] text-slate-600">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--tf-navy)]">{donation.donorName}</p>
                  <p className="text-xs text-slate-500">
                    {donation.donorEmail || donation.donorPhone || "N/A"}
                  </p>
                </td>
                <td className="px-4 py-3">{donation.campaign}</td>
                <td className="px-4 py-3">{formatDate(donation.donationDate, "dd MMM yyyy, hh:mm a")}</td>
                <td className="px-4 py-3 font-semibold text-[var(--tf-purple)]">
                  {formatCurrency(donation.amount)}
                </td>
                <td className="px-4 py-3">{donation.paymentMethod.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-[#ddd6f3] px-2.5 py-1.5 text-xs text-slate-600 hover:bg-[#f5f1fd]"
                      type="button"
                      onClick={() => onDownloadReceipt(donation)}
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-[#ddd6f3] px-2.5 py-1.5 text-xs text-slate-600 hover:bg-[#f5f1fd] disabled:opacity-70"
                      type="button"
                      onClick={() => onEmailReceipt(donation)}
                      disabled={activeReceiptId === donation._id}
                    >
                      <Mail size={14} />
                      {activeReceiptId === donation._id ? "Sending..." : "Email"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
