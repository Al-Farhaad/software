import nodemailer from "nodemailer";
import { env } from "../config/env";
import { PaymentMethod } from "../constants/donation-data";

interface ReceiptDonation {
  _id: unknown;
  donorName: string;
  amount: number;
  campaign: string;
  paymentMethod: PaymentMethod;
  donationDate: Date | string;
}

const createTransport = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const transporter = createTransport();

const receiptTemplate = (donation: ReceiptDonation) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2 style="margin-bottom:8px;color:#10234c;">Taba Foundation</h2>
    <p>Dear ${donation.donorName},</p>
    <p>Thank you for your generous donation. Here are your receipt details:</p>
    <ul>
      <li><strong>Receipt ID:</strong> ${String(donation._id)}</li>
      <li><strong>Campaign:</strong> ${donation.campaign}</li>
      <li><strong>Amount:</strong> INR ${donation.amount.toLocaleString("en-IN")}</li>
      <li><strong>Date:</strong> ${new Date(donation.donationDate).toLocaleString("en-IN")}</li>
      <li><strong>Payment Method:</strong> ${donation.paymentMethod}</li>
    </ul>
    <p>Regards,<br/>Taba Foundation Team</p>
  </div>
`;

export const sendDonationReceiptEmail = async (to: string, donation: ReceiptDonation) => {
  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject: `Donation Receipt - Taba Foundation (${String(donation._id)})`,
    html: receiptTemplate(donation),
  });
};
