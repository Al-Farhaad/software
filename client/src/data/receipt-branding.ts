export interface ReceiptBranding {
  quoteLines: [string, string];
  officeAddressLines: [string, string, string];
  logoPath?: string;
  signaturePath?: string;
  logoDataUrl?: string;
  founderSignatureDataUrl?: string;
  founderName: string;
}

export const receiptBranding: ReceiptBranding = {
  quoteLines: [
    "Kaam Woh Le Lijiye Tumko Jo Raazi Kare",
    "Theek Ho Naam-E-Raza Tum Pe Karodon Durood",
  ],
  officeAddressLines: [
    "Taba Foundation Office",
    "123 Community Road, Kolkata, West Bengal 700001",
    "Phone: +91 98765 43210  |  Email: info@tabafoundation.org",
  ],
  logoPath: "/taba-foundation-logo.jpg",
  signaturePath: "/signature.png",
  founderName: "Founder, Taba Foundation",
};
