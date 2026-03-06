import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CircleAlert, Download, Shield, Trash2, Upload } from "lucide-react";
import { APP_LOGIN_EMAIL, updateAppPassword } from "../../data/auth";
import { contributorApi, donationApi, investmentApi, systemApi } from "../../services/api";
import { AnalyticsFilterBar } from "../common/AnalyticsFilterBar";
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
  contributors: Contributor[];
  donations: Donation[];
  investments: Investment[];
  onRefreshAll: () => Promise<void>;
}

type ImportType = "donations" | "investments" | "contributors";

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

export const SettingsView = ({
  contributors,
  donations,
  investments,
  onRefreshAll,
}: SettingsViewProps) => {
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [dataMessageType, setDataMessageType] = useState<"success" | "error">("success");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityMessageType, setSecurityMessageType] = useState<"success" | "error">("success");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        donationDate: donation.donationDate
          ? String(donation.donationDate)
          : new Date().toISOString(),
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

  const handleUpdatePassword = (event: FormEvent) => {
    event.preventDefault();
    setSecurityMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityMessageType("error");
      setSecurityMessage("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessageType("error");
      setSecurityMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessageType("error");
      setSecurityMessage("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setSecurityMessageType("error");
      setSecurityMessage("New password should be different from current password.");
      return;
    }

    const result = updateAppPassword(currentPassword, newPassword);
    setSecurityMessageType(result.success ? "success" : "error");
    setSecurityMessage(result.message);

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
          Security
        </h2>
        <p className="mb-4 text-sm text-slate-500">Manage access and security settings</p>

        <p className="mb-3 text-xs text-slate-500">Login email: {APP_LOGIN_EMAIL}</p>

        <form className="grid gap-3" onSubmit={handleUpdatePassword}>
          <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
            Current Password
            <input
              className="tf-input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
            New Password
            <input
              className="tf-input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-[var(--tf-navy)]">
            Confirm Password
            <input
              className="tf-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button className="tf-btn-outline mt-2" type="submit">
            Update Password
          </button>
        </form>

        {securityMessage && (
          <p
            className={`mt-3 text-sm ${
              securityMessageType === "success" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {securityMessage}
          </p>
        )}
      </article>

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

      <div className="mt-3">
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
    </section>
  );
};
