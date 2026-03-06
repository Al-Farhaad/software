export const APP_LOGIN_EMAIL = "tabafoundationofficial@gmail.com";
export const APP_LOGIN_PASSWORD = "Taba_2026";

const AUTH_STORAGE_KEY = "tfms_auth_credentials_v1";

interface AppCredentials {
  email: string;
  password: string;
}

const getDefaultCredentials = (): AppCredentials => ({
  email: APP_LOGIN_EMAIL,
  password: APP_LOGIN_PASSWORD,
});

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const parseStoredCredentials = (value: string | null): AppCredentials | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<AppCredentials>;
    if (typeof parsed.email !== "string" || typeof parsed.password !== "string") {
      return null;
    }
    return {
      email: parsed.email,
      password: parsed.password,
    };
  } catch {
    return null;
  }
};

export const getAppCredentials = (): AppCredentials => {
  if (!canUseStorage()) {
    return getDefaultCredentials();
  }
  const stored = parseStoredCredentials(window.localStorage.getItem(AUTH_STORAGE_KEY));
  return stored ?? getDefaultCredentials();
};

export const validateAppLogin = (email: string, password: string) => {
  const credentials = getAppCredentials();
  return email.trim().toLowerCase() === credentials.email.toLowerCase() && password === credentials.password;
};

export const updateAppPassword = (currentPassword: string, nextPassword: string) => {
  const credentials = getAppCredentials();

  if (currentPassword !== credentials.password) {
    return { success: false, message: "Current password is incorrect." };
  }

  if (!canUseStorage()) {
    return { success: false, message: "Password storage is not available in this environment." };
  }

  const nextCredentials: AppCredentials = {
    email: credentials.email,
    password: nextPassword,
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextCredentials));

  return { success: true, message: "Password updated successfully." };
};
