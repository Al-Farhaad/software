import { jsPDF } from "jspdf";
import { receiptBranding } from "../data/receipt-branding";
import type { Donation } from "../types/donation";
import { formatDate } from "../utils/date";

const receiptFileName = (donation: Donation) => `taba-receipt-${donation._id}.pdf`;
const imageDataCache = new Map<string, string>();

const normalizeValue = (value?: string) => (value && value.trim() ? value : "N/A");

const getImageFormat = (dataUrl: string) => {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.startsWith("data:image/webp")) {
    return "WEBP";
  }
  return "PNG";
};

const formatAmountNumber = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to load branding image."));
    reader.readAsDataURL(blob);
  });

const resolveImageDataUrl = async (path?: string, inlineDataUrl?: string) => {
  if (inlineDataUrl) {
    return inlineDataUrl;
  }
  if (!path) {
    return undefined;
  }
  if (imageDataCache.has(path)) {
    return imageDataCache.get(path);
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      return undefined;
    }
    const dataUrl = await blobToDataUrl(await response.blob());
    imageDataCache.set(path, dataUrl);
    return dataUrl;
  } catch {
    return undefined;
  }
};

const drawLogo = (doc: jsPDF, centerX: number, startY: number, logoDataUrl?: string) => {
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, getImageFormat(logoDataUrl), centerX - 20, startY, 40, 40);
    return;
  }

  // Fallback logo if no image is configured.
  doc.setDrawColor(13, 27, 62);
  doc.setFillColor(234, 242, 255);
  doc.circle(centerX, startY + 20, 18, "FD");
  doc.setTextColor(13, 27, 62);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TF", centerX, startY + 24, { align: "center" });
};

const drawDetailsTable = (doc: jsPDF, startY: number, donation: Donation) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const tableX = 14;
  const tableWidth = pageWidth - 28;
  const labelWidth = 48;
  const valueWidth = tableWidth - labelWidth;
  const paddingX = 3;
  const paddingY = 2.5;
  const lineHeight = 4.2;

  let y = startY;

  const rows: Array<{ label: string; value: string; isAmount?: boolean }> = [
    { label: "Receipt ID", value: donation._id },
    { label: "Donation Date", value: formatDate(donation.donationDate, "dd MMM yyyy, hh:mm a") },
    { label: "Contributor Name", value: donation.donorName },
    { label: "Contributor Address", value: normalizeValue(donation.donorAddress) },
    { label: "Phone", value: normalizeValue(donation.donorPhone) },
    { label: "Email", value: normalizeValue(donation.donorEmail) },
    { label: "Campaign", value: donation.campaign },
    { label: "Payment Method", value: donation.paymentMethod.replace(/_/g, " ").toUpperCase() },
    { label: "Amount", value: formatAmountNumber(donation.amount), isAmount: true },
    { label: "Notes", value: normalizeValue(donation.notes) },
  ];

  const drawRupeeIcon = (x: number, iconTopY: number) => {
    const width = 4.1;
    const height = 5.2;

    doc.setDrawColor(13, 27, 62);
    doc.setLineWidth(0.5);
    doc.line(x, iconTopY, x + width, iconTopY);
    doc.line(x, iconTopY + 1.25, x + width - 0.6, iconTopY + 1.25);
    doc.line(x + 0.95, iconTopY, x + 0.95, iconTopY + height - 2);
    doc.line(x + 0.95, iconTopY + 2.05, x + width - 0.25, iconTopY + height);
    doc.setLineWidth(0.2);
  };

  const drawHeader = () => {
    doc.setFillColor(13, 27, 62);
    doc.rect(tableX, y, tableWidth, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Donation Details", tableX + 4, y + 6.2);
    y += 9;
  };

  drawHeader();

  rows.forEach((row, index) => {
    const labelLines = doc.splitTextToSize(row.label, labelWidth - paddingX * 2);
    const valueLines = row.isAmount
      ? [row.value]
      : doc.splitTextToSize(row.value, valueWidth - paddingX * 2);
    const rowLineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = rowLineCount * lineHeight + paddingY * 2;

    if (y + rowHeight > pageHeight - 45) {
      doc.addPage();
      y = 16;
      drawHeader();
    }

    if (index % 2 === 0) {
      doc.setFillColor(246, 249, 255);
      doc.rect(tableX, y, tableWidth, rowHeight, "F");
    }

    doc.setDrawColor(220, 228, 243);
    doc.rect(tableX, y, tableWidth, rowHeight);
    doc.line(tableX + labelWidth, y, tableX + labelWidth, y + rowHeight);

    doc.setTextColor(13, 27, 62);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(labelLines, tableX + paddingX, y + paddingY, { baseline: "top" });

    doc.setFont("helvetica", "normal");
    if (row.isAmount) {
      const valueText = valueLines[0] ?? "0";
      const valueX = tableX + labelWidth + paddingX;
      drawRupeeIcon(valueX, y + paddingY + 0.4);
      doc.text(valueText, valueX + 5.6, y + paddingY, { baseline: "top" });
    } else {
      doc.text(valueLines, tableX + labelWidth + paddingX, y + paddingY, { baseline: "top" });
    }

    y += rowHeight;
  });

  return y;
};

const drawSignature = (doc: jsPDF, startY: number, signatureDataUrl?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = startY;

  if (y > pageHeight - 45) {
    doc.addPage();
    y = 24;
  }

  const signatureX = pageWidth - 72;

  if (signatureDataUrl) {
    doc.addImage(
      signatureDataUrl,
      getImageFormat(signatureDataUrl),
      signatureX,
      y,
      52,
      18,
    );
  } else {
    doc.setTextColor(13, 27, 62);
    doc.setFont("times", "italic");
    doc.setFontSize(18);
    doc.text("Founder Signature", signatureX + 2, y + 12);
  }

  doc.setDrawColor(13, 27, 62);
  doc.line(signatureX, y + 21, signatureX + 52, y + 21);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(receiptBranding.founderName, signatureX + 26, y + 27, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Authorized Signatory", signatureX + 26, y + 32, { align: "center" });
};

const buildDonationReceipt = async (donation: Donation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const [logoDataUrl, signatureDataUrl] = await Promise.all([
    resolveImageDataUrl(receiptBranding.logoPath, receiptBranding.logoDataUrl),
    resolveImageDataUrl(receiptBranding.signaturePath, receiptBranding.founderSignatureDataUrl),
  ]);
  let y = 13;

  doc.setTextColor(13, 27, 62);
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text(receiptBranding.quoteLines[0], centerX, y, { align: "center" });
  y += 5;
  doc.text(receiptBranding.quoteLines[1], centerX, y, { align: "center" });

  y += 5;
  drawLogo(doc, centerX, y, logoDataUrl);

  y += 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(receiptBranding.officeAddressLines[0], centerX, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(receiptBranding.officeAddressLines[1], centerX, y, { align: "center" });
  y += 4;
  doc.text(receiptBranding.officeAddressLines[2], centerX, y, { align: "center" });

  y += 8;
  doc.setDrawColor(13, 27, 62);
  doc.line(14, y, pageWidth - 14, y);

  y += 8;
  const tableEndY = drawDetailsTable(doc, y, donation);
  drawSignature(doc, tableEndY + 8, signatureDataUrl);

  doc.setTextColor(70, 84, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("May Allah accept this contribution. Jazakumullahu Khairan.", centerX, 286, {
    align: "center",
  });

  return doc;
};

export const generateDonationReceipt = async (donation: Donation) => {
  const doc = await buildDonationReceipt(donation);
  doc.save(receiptFileName(donation));
};

export const printDonationReceipt = async (donation: Donation) => {
  const blob = (await buildDonationReceipt(donation)).output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Please allow popups to print receipt.");
  }

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const shareDonationReceipt = async (donation: Donation) => {
  const blob = (await buildDonationReceipt(donation)).output("blob");
  const fileName = receiptFileName(donation);
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (navigator.share) {
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Donation Receipt",
        text: `Receipt for ${donation.donorName}`,
        files: [file],
      });
      return;
    }

    await navigator.share({
      title: "Donation Receipt",
      text: `Receipt for ${donation.donorName}`,
      url: window.location.href,
    });
    return;
  }

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
