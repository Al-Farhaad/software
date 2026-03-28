import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaults = {
  mongoUri: "mongodb://127.0.0.1:27017/taba_foundation",
  clientUrl: "http://localhost:5173",
  jwtSecret: "change-me-for-production",
  superAdminName: "Super Admin",
  superAdminEmail: "tabafoundationofficial@gmail.com",
  superAdminPassword: "Taba_2026",
  emailFrom: "Taba Foundation <noreply@tabafoundation.org>",
};

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  port: parseNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI ?? defaults.mongoUri,
  clientUrl: process.env.CLIENT_URL ?? defaults.clientUrl,
  jwtSecret: process.env.JWT_SECRET ?? defaults.jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  superAdminName: process.env.SUPERADMIN_NAME ?? defaults.superAdminName,
  superAdminEmail: process.env.SUPERADMIN_EMAIL ?? defaults.superAdminEmail,
  superAdminPassword: process.env.SUPERADMIN_PASSWORD ?? defaults.superAdminPassword,
  emailFrom: process.env.EMAIL_FROM ?? defaults.emailFrom,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
};

if (nodeEnv === "production") {
  const requiredVariables: Array<{ key: string; value: string | undefined }> = [
    { key: "MONGODB_URI", value: process.env.MONGODB_URI },
    { key: "CLIENT_URL", value: process.env.CLIENT_URL },
    { key: "JWT_SECRET", value: process.env.JWT_SECRET },
    { key: "SUPERADMIN_EMAIL", value: process.env.SUPERADMIN_EMAIL },
    { key: "SUPERADMIN_PASSWORD", value: process.env.SUPERADMIN_PASSWORD },
  ];

  const missing = requiredVariables
    .filter(({ value }) => !value || !value.trim())
    .map(({ key }) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  if (env.mongoUri.includes("127.0.0.1")) {
    throw new Error("In production, MONGODB_URI must not point to localhost.");
  }

  if (env.jwtSecret === defaults.jwtSecret) {
    throw new Error("In production, JWT_SECRET must not use the default value.");
  }

  if (env.superAdminPassword === defaults.superAdminPassword) {
    throw new Error("In production, SUPERADMIN_PASSWORD must not use the default value.");
  }
}
