import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CircleAlert, Download, Shield, Trash2, Upload, UserPlus } from "lucide-react";
import {
  adminApi,
  authApi,
  authStorage,
  contributorApi,
  donationApi,
  investmentApi,
  systemApi,
} from "../../services/api";
import { AnalyticsFilterBar } from "../common/AnalyticsFilterBar";
import type { AuthUser } from "../../types/auth";
import type { Contributor } from "../../types/contributor";
import type { Donation } from "../../types/donation";
import type { Investment } from "../../types/investment";
import {
  analyticsFilterLabel,
  defaultAnalyticsDate,
  filterByAnalyticsRange,
  type AnalyticsFilterType,
} from "../../utils/analytics-filter";

interface SettingsViewProps {
  currentUser: AuthUser;
  contributors: Contributor[];
  donations: Donation[];
  investments: Investment[];
  onRefreshAll: () => Promise<void>;
}

type ImportType = "donations" | "investments" | "contributors";
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024;

const csvCell = (value: unknown) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<unknown>>) => {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  const csvContent = `\uFEFF${lines.join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const parseCsv = (content: string) => {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) {
    return [];
  }

  const parseRow = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return values.map((value) => value.trim());
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
};

const normalizeImportTypeFromHeaders = (headers: string[]): ImportType | null => {
  const headerSet = new Set(headers.map((header) => header.trim()));
  if (headerSet.has("donorName") && headerSet.has("amount")) {
    return "donations";
  }
  if (headerSet.has("nameWhereInvested") && headerSet.has("amountInvested")) {
    return "investments";
  }
  if (headerSet.has("name") && headerSet.has("phoneNo") && headerSet.has("address")) {
    return "contributors";
  }
  return null;
};

const formatRole = (role: AuthUser["role"]) => (role === "superadmin" ? "Super Admin" : "Sub Admin");

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read selected image."));
    };
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });

export const SettingsView = ({
  currentUser,
  contributors,
  donations,
  investments,
  onRefreshAll,
}: SettingsViewProps) => {
  const isSuperAdmin = currentUser.role === "superadmin";

  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [dataMessageType, setDataMessageType] = useState<"success" | "error">("success");

  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminMessageType, setAdminMessageType] = useState<"success" | "error">("success");
  const [subAdmins, setSubAdmins] = useState<AuthUser[]>([]);
  const [loadingSubAdmins, setLoadingSubAdmins] = useState(false);
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false);
  const [deletingSubAdminId, setDeletingSubAdminId] = useState<string | null>(null);
  const [subAdminName, setSubAdminName] = useState("");
  const [subAdminEmail, setSubAdminEmail] = useState("");
  const [subAdminPassword, setSubAdminPassword] = useState("");
  const [signaturePreview, setSignaturePreview] = useState(currentUser.signatureDataUrl ?? "");
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signatureMessageType, setSignatureMessageType] = useState<"success" | "error">("success");
  const [updatingSignature, setUpdatingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const [importing, setImporting] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [filterType, setFilterType] = useState<AnalyticsFilterType>("monthly");
  const [selectedDate, setSelectedDate] = useState(defaultAnalyticsDate());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const contributorByMongoId = useMemo(
    () => new Map(contributors.map((contributor) => [contributor._id, contributor])),
    [contributors],
  );
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
  const filterLabel = analyticsFilterLabel(filterType, selectedDate);

  const loadSubAdmins = async () => {
    if (!isSuperAdmin) {
      return;
    }
    try {
      setLoadingSubAdmins(true);
      setAdminMessage(null);
      const users = await adminApi.listSubAdmins();
      setSubAdmins(users);
    } catch (error) {
      setAdminMessageType("error");
      setAdminMessage(error instanceof Error ? error.message : "Failed to load sub-admins.");
    } finally {
      setLoadingSubAdmins(false);
    }
  };

  useEffect(() => {
    void loadSubAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  useEffect(() => {
    setSignaturePreview(currentUser.signatureDataUrl ?? "");
  }, [currentUser.signatureDataUrl]);

  const handleCreateSubAdmin = async () => {
    if (!subAdminName.trim() || !subAdminEmail.trim() || !subAdminPassword.trim()) {
      setAdminMessageType("error");
      setAdminMessage("Name, email and password are required.");
      return;
    }
    if (subAdminPassword.trim().length < 6) {
      setAdminMessageType("error");
      setAdminMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setCreatingSubAdmin(true);
      setAdminMessage(null);
      const created = await adminApi.createSubAdmin({
        name: subAdminName.trim(),
        email: subAdminEmail.trim(),
        password: subAdminPassword.trim(),
      });
      setSubAdminName("");
      setSubAdminEmail("");
      setSubAdminPassword("");
      setAdminMessageType("success");
      setAdminMessage(
        `Sub-admin created: ${created.name} (${created.email}). Share these credentials securely.`,
      );
      await loadSubAdmins();
    } catch (error) {
      setAdminMessageType("error");
      setAdminMessage(error instanceof Error ? error.message : "Failed to create sub-admin.");
    } finally {
      setCreatingSubAdmin(false);
    }
  };

  const handleDeleteSubAdmin = async (subAdmin: AuthUser) => {
    const confirmed = window.confirm(`Do you want to delete "${subAdmin.name}" sub admin?..`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSubAdminId(subAdmin.id);
      setAdminMessage(null);
      await adminApi.deleteSubAdmin(subAdmin.id);
      setAdminMessageType("success");
      setAdminMessage(`Sub-admin deleted: ${subAdmin.name}.`);
      await loadSubAdmins();
    } catch (error) {
      setAdminMessageType("error");
      setAdminMessage(error instanceof Error ? error.message : "Failed to delete sub-admin.");
    } finally {
      setDeletingSubAdminId(null);
    }
  };

  const updateStoredSessionUser = (updatedUser: AuthUser) => {
    const session = authStorage.getSession();
    if (!session) {
      return;
    }
    authStorage.setSession({
      token: session.token,
      user: updatedUser,
    });
  };

  const handleUploadSignature = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      setUpdatingSignature(true);
      setSignatureMessage(null);

      if (!selectedFile.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
      }
      if (selectedFile.size > MAX_SIGNATURE_SIZE_BYTES) {
        throw new Error("Signature image must be 2MB or smaller.");
      }

      const signatureDataUrl = await readFileAsDataUrl(selectedFile);
      const updatedUser = await authApi.updateSignature(signatureDataUrl);
      setSignaturePreview(updatedUser.signatureDataUrl ?? "");
      updateStoredSessionUser(updatedUser);
      setSignatureMessageType("success");
      setSignatureMessage("Signature uploaded. New receipts will use this receiver signature.");
    } catch (error) {
      setSignatureMessageType("error");
      setSignatureMessage(error instanceof Error ? error.message : "Failed to upload signature.");
    } finally {
      setUpdatingSignature(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = "";
      }
    }
  };

  const handleRemoveSignature = async () => {
    try {
      setUpdatingSignature(true);
      setSignatureMessage(null);
      const updatedUser = await authApi.updateSignature(undefined);
      setSignaturePreview(updatedUser.signatureDataUrl ?? "");
      updateStoredSessionUser(updatedUser);
      setSignatureMessageType("success");
      setSignatureMessage("Signature removed. Receipts will use the default signature image.");
    } catch (error) {
      setSignatureMessageType("error");
      setSignatureMessage(error instanceof Error ? error.message : "Failed to remove signature.");
    } finally {
      setUpdatingSignature(false);
    }
  };

  const handleExportDonations = () => {
    const rows = filteredDonations.map((donation) => {
      const contributor = donation.contributorId
        ? contributorByMongoId.get(donation.contributorId)
        : undefined;

      return [
        contributor?.contributorId || "N/A",
        contributor?.name || donation.donorName,
        contributor?.phoneNo || donation.donorPhone || "",
        contributor?.email || donation.donorEmail || "",
        contributor?.address || donation.donorAddress || "",
        donation.amount,
        donation.campaign,
        donation.paymentMethod,
        donation.donationDate,
        donation.notes || "",
      ];
    });

    downloadCsv(
      "taba-donations-export.xls",
      [
        "contributorCode",
        "donorName",
        "phoneNo",
        "email",
        "address",
        "amount",
        "campaign",
        "paymentMethod",
        "donationDate",
        "notes",
      ],
      rows,
    );
    setDataMessageType("success");
    setDataMessage(`Donations exported successfully for ${filterLabel}.`);
  };

  const handleExportInvestments = () => {
    const rows = filteredInvestments.map((investment) => [
      investment.nameWhereInvested,
      investment.amountInvested,
      investment.note || "",
      investment.investedAt || investment.createdAt,
    ]);

    downloadCsv(
      "taba-investments-export.xls",
      ["nameWhereInvested", "amountInvested", "note", "investedAt"],
      rows,
    );
    setDataMessageType("success");
    setDataMessage(`Investments exported successfully for ${filterLabel}.`);
  };

  const handleDeleteAllData = async () => {
    if (!isSuperAdmin) {
      setDataMessageType("error");
      setDataMessage("Only super admin can delete all data.");
      return;
    }

    const confirmed = window.confirm(
      "Delete all contributors, donations, and investments? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingData(true);
      setDataMessage(null);
      const deleted = await systemApi.deleteAllData();
      await onRefreshAll();
      setDataMessageType("success");
      setDataMessage(
        `All data deleted. Donations: ${deleted.donationsDeleted}, Investments: ${deleted.investmentsDeleted}, Contributors: ${deleted.contributorsDeleted}.`,
      );
    } catch (error) {
      setDataMessageType("error");
      setDataMessage(error instanceof Error ? error.message : "Failed to delete all data.");
    } finally {
      setDeletingData(false);
    }
  };

  const importFromJson = async (payload: unknown) => {
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid JSON format.");
    }

    let imported = 0;
    const parsed = payload as {
      donations?: Array<Record<string, unknown>>;
      investments?: Array<Record<string, unknown>>;
      contributors?: Array<Record<string, unknown>>;
    };

    for (const contributor of parsed.contributors ?? []) {
      if (!contributor.name) {
        continue;
      }
      await contributorApi.createContributor({
        name: String(contributor.name),
        phoneNo: contributor.phoneNo ? String(contributor.phoneNo) : undefined,
        email: contributor.email ? String(contributor.email) : undefined,
        address: contributor.address ? String(contributor.address) : undefined,
      });
      imported += 1;
    }

    for (const donation of parsed.donations ?? []) {
      if (!donation.donorName || !donation.amount || !donation.campaign || !donation.paymentMethod) {
        continue;
      }
      await donationApi.createDonation({
        donorName: String(donation.donorName),
        amount: Number(donation.amount),
        campaign: String(donation.campaign),
        paymentMethod: String(donation.paymentMethod) as
          | "cash"
          | "bank_transfer"
          | "upi"
          | "card"
          | "other",
        donationDate: donation.donationDate ? String(donation.donationDate) : new Date().toISOString(),
        donorEmail: donation.donorEmail ? String(donation.donorEmail) : undefined,
        donorPhone: donation.donorPhone ? String(donation.donorPhone) : undefined,
        donorAddress: donation.donorAddress ? String(donation.donorAddress) : undefined,
        notes: donation.notes ? String(donation.notes) : undefined,
      });
      imported += 1;
    }

    for (const investment of parsed.investments ?? []) {
      if (!investment.nameWhereInvested || !investment.amountInvested) {
        continue;
      }
      await investmentApi.createInvestment({
        nameWhereInvested: String(investment.nameWhereInvested),
        amountInvested: Number(investment.amountInvested),
        note: investment.note ? String(investment.note) : undefined,
        investedAt: investment.investedAt ? String(investment.investedAt) : undefined,
      });
      imported += 1;
    }

    return imported;
  };

  const importFromCsvRows = async (rows: Array<Record<string, string>>) => {
    if (!rows.length) {
      throw new Error("CSV file is empty.");
    }

    const importType = normalizeImportTypeFromHeaders(Object.keys(rows[0]));
    if (!importType) {
      throw new Error("Unknown CSV format. Use exported donation/investment/contributor CSV.");
    }

    let imported = 0;

    if (importType === "contributors") {
      for (const row of rows) {
        if (!row.name) {
          continue;
        }
        await contributorApi.createContributor({
          name: row.name,
          phoneNo: row.phoneNo || undefined,
          email: row.email || undefined,
          address: row.address || undefined,
        });
        imported += 1;
      }
      return imported;
    }

    if (importType === "donations") {
      for (const row of rows) {
        if (!row.donorName || !row.amount || !row.campaign || !row.paymentMethod) {
          continue;
        }
        await donationApi.createDonation({
          donorName: row.donorName,
          amount: Number(row.amount),
          campaign: row.campaign,
          paymentMethod: row.paymentMethod as "cash" | "bank_transfer" | "upi" | "card" | "other",
          donationDate: row.donationDate || new Date().toISOString(),
          donorEmail: row.email || undefined,
          donorPhone: row.phoneNo || undefined,
          donorAddress: row.address || undefined,
          notes: row.notes || undefined,
        });
        imported += 1;
      }
      return imported;
    }

    for (const row of rows) {
      if (!row.nameWhereInvested || !row.amountInvested) {
        continue;
      }
      await investmentApi.createInvestment({
        nameWhereInvested: row.nameWhereInvested,
        amountInvested: Number(row.amountInvested),
        note: row.note || undefined,
        investedAt: row.investedAt || undefined,
      });
      imported += 1;
    }

    return imported;
  };

  const handleImportData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      setDataMessage(null);
      const content = await file.text();
      const fileName = file.name.toLowerCase();

      let importedCount = 0;
      if (fileName.endsWith(".json")) {
        importedCount = await importFromJson(JSON.parse(content));
      } else if (fileName.endsWith(".csv") || fileName.endsWith(".xls")) {
        importedCount = await importFromCsvRows(parseCsv(content));
      } else {
        throw new Error("Only .json, .csv or .xls files are supported for import.");
      }

      await onRefreshAll();
      setDataMessageType("success");
      setDataMessage(`Import completed. ${importedCount} record(s) imported.`);
    } catch (error) {
      setDataMessageType("error");
      setDataMessage(error instanceof Error ? error.message : "Failed to import data.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="space-y-5">
      <div className="tf-page-header">
        <h1 className="tf-page-title">Settings</h1>
        <p className="tf-page-subtitle">Manage application preferences and configurations</p>
      </div>

      <article className="tf-section-card">
        <h2 className="mb-1.5 flex items-center gap-2 text-xl font-bold leading-none text-[var(--tf-navy)]">
          <Shield size={18} />
          Account
        </h2>
        <p className="mb-4 text-sm text-slate-500">Authenticated profile details</p>

        <div className="grid gap-2 text-sm">
          <p>
            <span className="font-semibold text-slate-700">Name:</span> {currentUser.name}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Email:</span> {currentUser.email}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Role:</span> {formatRole(currentUser.role)}
          </p>
        </div>
      </article>

      <article className="tf-section-card">
        <h2 className="mb-1.5 flex items-center gap-2 text-xl font-bold leading-none text-[var(--tf-navy)]">
          <Upload size={18} />
          Receipt Signature
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Upload your receiver signature. When you create a donation receipt, this signature appears in
          the receiver signature section.
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            className="tf-btn-outline"
            type="button"
            onClick={() => signatureInputRef.current?.click()}
            disabled={updatingSignature}
          >
            <Upload size={14} />
            {updatingSignature ? "Saving..." : "Upload Signature"}
          </button>
          <input
            ref={signatureInputRef}
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => void handleUploadSignature(event)}
          />
          {signaturePreview && (
            <button
              className="tf-btn-outline"
              type="button"
              onClick={() => void handleRemoveSignature()}
              disabled={updatingSignature}
            >
              <Trash2 size={14} />
              Remove Signature
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">Supported: PNG, JPG, WEBP, SVG. Max size: 2MB.</p>

        {signaturePreview ? (
          <div className="mt-4 rounded-xl border border-[var(--tf-border)] bg-white p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Current Signature Preview</p>
            <img
              src={signaturePreview}
              alt="Current receiver signature"
              className="h-20 max-w-full object-contain"
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No custom signature uploaded yet.</p>
        )}

        {signatureMessage && (
          <p
            className={`mt-3 text-sm ${
              signatureMessageType === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {signatureMessage}
          </p>
        )}
      </article>

      {isSuperAdmin && (
        <article className="tf-section-card">
          <h2 className="mb-1.5 flex items-center gap-2 text-xl font-bold leading-none text-[var(--tf-navy)]">
            <UserPlus size={18} />
            Sub Admin Management
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Create sub-admin credentials and share them securely.
          </p>

          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
              Name
              <input
                className="tf-input"
                type="text"
                value={subAdminName}
                onChange={(event) => setSubAdminName(event.target.value)}
                disabled={creatingSubAdmin || loadingSubAdmins || deletingSubAdminId !== null}
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
              Email
              <input
                className="tf-input"
                type="email"
                value={subAdminEmail}
                onChange={(event) => setSubAdminEmail(event.target.value)}
                disabled={creatingSubAdmin || loadingSubAdmins || deletingSubAdminId !== null}
              />
            </label>
            <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
              Password
              <input
                className="tf-input"
                type="password"
                value={subAdminPassword}
                onChange={(event) => setSubAdminPassword(event.target.value)}
                disabled={creatingSubAdmin || loadingSubAdmins || deletingSubAdminId !== null}
              />
            </label>

            <button
              className="tf-btn-outline mt-1"
              type="button"
              onClick={() => void handleCreateSubAdmin()}
              disabled={creatingSubAdmin || loadingSubAdmins || deletingSubAdminId !== null}
            >
              {creatingSubAdmin ? "Creating..." : "Create Sub Admin"}
            </button>
          </div>

          {adminMessage && (
            <p className={`mt-3 text-sm ${adminMessageType === "success" ? "text-emerald-600" : "text-rose-600"}`}>
              {adminMessage}
            </p>
          )}

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-700">Existing Sub Admins</h3>
            {loadingSubAdmins ? (
              <p className="mt-2 text-sm text-slate-500">Loading sub-admins...</p>
            ) : subAdmins.length ? (
              <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--tf-border)]">
                <table className="min-w-full divide-y divide-[var(--tf-border)] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Created</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tf-border)] bg-white">
                    {subAdmins.map((subAdmin) => (
                      <tr key={subAdmin.id}>
                        <td className="px-3 py-2 text-slate-700">{subAdmin.name}</td>
                        <td className="px-3 py-2 text-slate-700">{subAdmin.email}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {subAdmin.createdAt ? new Date(subAdmin.createdAt).toLocaleString() : "N/A"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="inline-flex items-center justify-center rounded-md border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => void handleDeleteSubAdmin(subAdmin)}
                            disabled={deletingSubAdminId !== null || creatingSubAdmin || loadingSubAdmins}
                            aria-label={`Delete ${subAdmin.name}`}
                            title={`Delete ${subAdmin.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No sub-admins found.</p>
            )}
          </div>
        </article>
      )}

      <article className="tf-section-card">
        <h2 className="mb-1.5 flex items-center gap-2 text-xl font-bold leading-none text-[var(--tf-navy)]">
          <CircleAlert size={18} />
          Data Management
        </h2>
        <p className="mb-4 text-sm text-slate-500">Export, import or delete data</p>

        <div className="mb-3">
          <AnalyticsFilterBar
            filterType={filterType}
            selectedDate={selectedDate}
            onFilterTypeChange={setFilterType}
            onDateChange={setSelectedDate}
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button className="tf-btn-outline" type="button" onClick={handleExportDonations}>
            <Download size={14} />
            Export Donations
          </button>
          <button className="tf-btn-outline" type="button" onClick={handleExportInvestments}>
            <Download size={14} />
            Export Investments
          </button>
          <button
            className="tf-btn-outline"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || deletingData}
          >
            <Upload size={14} />
            {importing ? "Importing..." : "Import Data"}
          </button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept=".json,.csv,.xls"
            onChange={(event) => void handleImportData(event)}
          />
        </div>

        {isSuperAdmin ? (
          <div className="mt-4">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => void handleDeleteAllData()}
              disabled={importing || deletingData}
            >
              <Trash2 size={14} />
              {deletingData ? "Deleting..." : "Delete All Data"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Delete all data is available only to super admin.</p>
        )}

        {dataMessage && (
          <p
            className={`mt-3 text-sm ${
              dataMessageType === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {dataMessage}
          </p>
        )}
      </article>
    </section>
  );
};
