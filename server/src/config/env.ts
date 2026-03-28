import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/taba_foundation",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-for-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  superAdminName: process.env.SUPERADMIN_NAME ?? "Super Admin",
  superAdminEmail: process.env.SUPERADMIN_EMAIL ?? "tabafoundationofficial@gmail.com",
  superAdminPassword: process.env.SUPERADMIN_PASSWORD ?? "Taba_2026",
  emailFrom: process.env.EMAIL_FROM ?? "Taba Foundation <noreply@tabafoundation.org>",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
};
