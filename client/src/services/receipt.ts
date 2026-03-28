import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { authStorage } from "./api";
import type { Donation } from "../types/donation";
import { formatDate } from "../utils/date";

const receiptFileName = (donation: Donation) => `taba-receipt-${donation._id}.pdf`;
const receiptTemplatePath = "/receipt-template-extracted.jpg";
const managerSignaturePath = "/Manager_Sign.png";
const managerStampPath = "/stamp.png";

const pageSize = {
  width: 1969,
  height: 1262,
};

const pdfSize = {
  width: 472.3058,
  height: 302.5219,
};

const colors = {
  page: "#dfeaf4",
  ink: "#000000", // #414b96
  accent: "#b13b39",
};

const handwritingFontFamily =
  '"Segoe Script", "Segoe Print", "Lucida Handwriting", "Bradley Hand", "Brush Script MT", "Comic Sans MS", cursive';

const normalizeValue = (value?: string) => (value && value.trim() ? value.trim() : "");

const sanitizeReceiptText = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "")
    .trim();

const formatAmountFigure = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

const amountBelowTwenty = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tensWords = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const convertBelowThousand = (value: number): string => {
  if (value === 0) {
    return "";
  }

  if (value < 20) {
    return amountBelowTwenty[value];
  }

  if (value < 100) {
    const tens = tensWords[Math.floor(value / 10)];
    const unit = amountBelowTwenty[value % 10];
    return unit ? `${tens} ${unit}` : tens;
  }

  const hundreds = `${amountBelowTwenty[Math.floor(value / 100)]} Hundred`;
  const remainder = convertBelowThousand(value % 100);
  return remainder ? `${hundreds} ${remainder}` : hundreds;
};

const convertIntegerToWords = (value: number): string => {
  if (value === 0) {
    return "Zero";
  }

  const parts: string[] = [];
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;

  if (crore) {
    parts.push(`${convertBelowThousand(crore)} Crore`);
  }
  if (lakh) {
    parts.push(`${convertBelowThousand(lakh)} Lakh`);
  }
  if (thousand) {
    parts.push(`${convertBelowThousand(thousand)} Thousand`);
  }
  if (hundred) {
    parts.push(convertBelowThousand(hundred));
  }

  return parts.join(" ").trim();
};

const convertAmountToWords = (amount: number): string => {
  const roundedAmount = Number(amount.toFixed(2));
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);
  const rupeesText = `${convertIntegerToWords(rupees)} Rupees`;

  if (!paise) {
    return `${rupeesText} Only`;
  }

  return `${rupeesText} and ${convertIntegerToWords(paise)} Paise Only`;
};

const buildAddressLine = (donation: Donation) => {
  const address = normalizeValue(donation.donorAddress);
  if (address) {
    return sanitizeReceiptText(address);
  }

  const fallback = [normalizeValue(donation.donorPhone), normalizeValue(donation.donorEmail)]
    .filter(Boolean)
    .join(" | ");

  return sanitizeReceiptText(fallback || "N/A");
};

const applyStyles = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
  Object.assign(element.style, styles);
};

const fitText = (element: HTMLElement, options: { maxFontSize: number; minFontSize: number }) => {
  let fontSize = options.maxFontSize;
  element.style.fontSize = `${fontSize}px`;

  while (
    fontSize > options.minFontSize &&
    (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
  ) {
    fontSize -= 1;
    element.style.fontSize = `${fontSize}px`;
  }
};

const fitAutoTextElements = (root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>("[data-max-font-size]").forEach((element) => {
    fitText(element, {
      maxFontSize: Number(element.dataset.maxFontSize),
      minFontSize: Number(element.dataset.minFontSize),
    });
  });
};

type TextAlign = "left" | "center" | "right";
type VerticalAlign = "top" | "center" | "bottom";

interface OverlayFieldDefinition {
  left: number;
  top: number;
  width: number;
  height: number;
  maxFontSize: number;
  minFontSize: number;
  align?: TextAlign;
  verticalAlign?: VerticalAlign;
  color?: string;
  fontWeight?: string;
  letterSpacing?: string;
  padding?: string;
}

interface OverlayImageDefinition {
  left: number;
  top: number;
  width: number;
  height: number;
  opacity?: number;
}

const createHandwrittenText = (
  value: string,
  options: Pick<
    OverlayFieldDefinition,
    "maxFontSize" | "minFontSize" | "align" | "verticalAlign" | "color" | "fontWeight" | "letterSpacing"
  >,
) => {
  const text = document.createElement("div");
  applyStyles(text, {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    justifyContent:
      options.align === "center"
        ? "center"
        : options.align === "right"
          ? "flex-end"
          : "flex-start",
    alignItems:
      options.verticalAlign === "top"
        ? "flex-start"
        : options.verticalAlign === "center"
          ? "center"
          : "flex-end",
    color: options.color ?? colors.ink,
    fontFamily: handwritingFontFamily,
    fontWeight: options.fontWeight ?? "500",
    fontStyle: "italic",
    whiteSpace: "nowrap",
    textAlign: options.align ?? "left",
    lineHeight: "1",
    letterSpacing: options.letterSpacing ?? "0.2px",
  });
  text.dataset.maxFontSize = String(options.maxFontSize);
  text.dataset.minFontSize = String(options.minFontSize);
  text.textContent = sanitizeReceiptText(value);
  return text;
};

const createOverlayField = (value: string, definition: OverlayFieldDefinition) => {
  const shell = document.createElement("div");
  applyStyles(shell, {
    position: "absolute",
    left: `${definition.left}px`,
    top: `${definition.top}px`,
    width: `${definition.width}px`,
    height: `${definition.height}px`,
    padding: definition.padding ?? "0 8px 6px 8px",
    boxSizing: "border-box",
    overflow: "hidden",
  });

  shell.appendChild(createHandwrittenText(value, definition));
  return shell;
};

const managerSignatureDefinition: OverlayImageDefinition = {
  left: 650,
  top: 950,
  width: 380,
  height: 118,
  opacity: 0.95,
};

const managerStampDefinition: OverlayImageDefinition = {
  left: 550,
  top: 950,
  width: 310,
  height: 200,
  opacity: 0.92,
};

const receiverSignatureDefinition: OverlayImageDefinition = {
  left: 1320,
  top: 968,
  width: 380,
  height: 118,
  opacity: 0.95,
};

const receiverNameFallbackDefinition: OverlayFieldDefinition = {
  left: 1290,
  top: 980,
  width: 380,
  height: 44,
  maxFontSize: 34,
  minFontSize: 16,
  align: "center",
  verticalAlign: "center",
  padding: "0 8px",
};

const createOverlayImage = (
  src: string,
  alt: string,
  definition: OverlayImageDefinition,
) => {
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  applyStyles(image, {
    position: "absolute",
    left: `${definition.left}px`,
    top: `${definition.top}px`,
    width: `${definition.width}px`,
    height: `${definition.height}px`,
    objectFit: "contain",
    objectPosition: "center",
    opacity: String(definition.opacity ?? 1),
    pointerEvents: "none",
  });
  return image;
};

const receiptOverlayFields = (donation: Donation): Array<{ value: string; definition: OverlayFieldDefinition }> => [
  {
    value: donation.donorName || "N/A",
    definition: {
      left: 350,
      top: 600,
      width: 1500,
      height: 58,
      maxFontSize: 36,
      minFontSize: 18,
      verticalAlign: "top",
    },
  },
  {
    value: buildAddressLine(donation),
    definition: {
      left: 300,
      top: 700,
      width: 1510,
      height: 58,
      maxFontSize: 34,
      minFontSize: 16,
      verticalAlign: "top",
    },
  },
  {
    value: convertAmountToWords(donation.amount),
    definition: {
      left: 400,
      top: 795,
      width: 1330,
      height: 56,
      maxFontSize: 34,
      minFontSize: 16,
      letterSpacing: "0.1px",
      verticalAlign: "top",
    },
  },
  {
    value: formatDate(donation.donationDate, "dd/MM/yyyy"),
    definition: {
      left: 300,
      top: 895,
      width: 430,
      height: 52,
      maxFontSize: 32,
      minFontSize: 17,
      verticalAlign: "top",
    },
  },
  {
    value: donation.campaign || "N/A",
    definition: {
      left: 1120,
      top: 895,
      width: 610,
      height: 52,
      maxFontSize: 30,
      minFontSize: 15,
      verticalAlign: "top",
    },
  },
  {
    value: formatAmountFigure(donation.amount),
    definition: {
      left: 170,
      top: 965,
      width: 355,
      height: 92,
      maxFontSize: 52,
      minFontSize: 28,
      align: "right",
      verticalAlign: "center",
      color: colors.accent,
      fontWeight: "600",
      padding: "6px 26px 6px 70px",
    },
  },
];

const waitForImage = (image: HTMLImageElement, errorMessage: string) =>
  new Promise<void>((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) {
      resolve();
      return;
    }

    image.onload = () => resolve();
    image.onerror = () => reject(new Error(errorMessage));
  });

const createReceiptElement = async (donation: Donation) => {
  const sessionUser = authStorage.getSession()?.user;
  const receiverSignatureSource = sessionUser?.signatureDataUrl;
  const receiverNameFallback =
    sessionUser?.role === "subadmin" && !receiverSignatureSource
      ? normalizeValue(sessionUser.name)
      : "";

  const root = document.createElement("div");
  applyStyles(root, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${pageSize.width}px`,
    height: `${pageSize.height}px`,
    background: colors.page,
    overflow: "hidden",
  });

  const templateImage = document.createElement("img");
  templateImage.src = receiptTemplatePath;
  templateImage.alt = "Donation receipt template";
  applyStyles(templateImage, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  });

  const overlayLayer = document.createElement("div");
  applyStyles(overlayLayer, {
    position: "absolute",
    inset: "0",
  });

  receiptOverlayFields(donation).forEach(({ value, definition }) => {
    overlayLayer.appendChild(createOverlayField(value, definition));
  });

  const managerSignatureImage = createOverlayImage(
    managerSignaturePath,
    "Manager signature",
    managerSignatureDefinition,
  );
  overlayLayer.appendChild(managerSignatureImage);

  const managerStampImage = createOverlayImage(
    managerStampPath,
    "Manager stamp",
    managerStampDefinition,
  );
  overlayLayer.appendChild(managerStampImage);

  const receiverSignatureImage = receiverSignatureSource
    ? createOverlayImage(
        receiverSignatureSource,
        "Receiver signature",
        receiverSignatureDefinition,
      )
    : null;

  if (receiverSignatureImage) {
    overlayLayer.appendChild(receiverSignatureImage);
  } else if (receiverNameFallback) {
    overlayLayer.appendChild(
      createOverlayField(receiverNameFallback, receiverNameFallbackDefinition),
    );
  }

  root.append(templateImage, overlayLayer);
  document.body.appendChild(root);

  await waitForImage(templateImage, "Receipt template image could not be loaded.");
  try {
    await waitForImage(managerSignatureImage, "Manager signature image could not be loaded.");
  } catch (error) {
    // If manager signature fails to load, continue generating receipt with template and text fields.
    // eslint-disable-next-line no-console
    console.warn(error);
  }

  try {
    await waitForImage(managerStampImage, "Manager stamp image could not be loaded.");
  } catch (error) {
    // If stamp fails to load, continue generating receipt with template and other fields.
    // eslint-disable-next-line no-console
    console.warn(error);
  }

  if (receiverSignatureImage) {
    try {
      await waitForImage(receiverSignatureImage, "Receipt signature image could not be loaded.");
    } catch (error) {
      // If receiver signature fails to load, continue generating receipt with manager sign and text fields.
      // eslint-disable-next-line no-console
      console.warn(error);
    }
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  fitAutoTextElements(root);

  return root;
};

const renderReceiptPdf = async (donation: Donation) => {
  const receiptElement = await createReceiptElement(donation);

  try {
    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: colors.page,
      logging: false,
    });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [pdfSize.height, pdfSize.width],
    });

    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfSize.width, pdfSize.height);
    return doc;
  } finally {
    receiptElement.remove();
  }
};

export const generateDonationReceipt = async (donation: Donation) => {
  const doc = await renderReceiptPdf(donation);
  doc.save(receiptFileName(donation));
};

export const printDonationReceipt = async (donation: Donation) => {
  const blob = (await renderReceiptPdf(donation)).output("blob");
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
  const blob = (await renderReceiptPdf(donation)).output("blob");
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
