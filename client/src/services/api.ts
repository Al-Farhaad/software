import axios from "axios";
import type { AuthSession, AuthUser } from "../types/auth";
import type { Contributor, ContributorInput } from "../types/contributor";
import type { Donation, DonationFilters, DonationInput, DonationStats } from "../types/donation";
import type { Investment, InvestmentInput, InvestmentListPayload } from "../types/investment";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface LoginResponse {
  token: string;
  expiresIn: string;
  user: AuthUser;
}

export const AUTH_EXPIRED_EVENT = "tfms:auth-expired";

const AUTH_TOKEN_STORAGE_KEY = "tfms_auth_token_v2";
const AUTH_USER_STORAGE_KEY = "tfms_auth_user_v2";

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const parseStoredUser = (value: string | null): AuthUser | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as Partial<AuthUser>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.email !== "string" ||
      (parsed.role !== "superadmin" && parsed.role !== "subadmin")
    ) {
      return null;
    }
    if (parsed.signatureDataUrl !== undefined && typeof parsed.signatureDataUrl !== "string") {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      signatureDataUrl: parsed.signatureDataUrl,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
};

export const authStorage = {
  getSession(): AuthSession | null {
    if (!canUseStorage()) {
      return null;
    }
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const user = parseStoredUser(window.localStorage.getItem(AUTH_USER_STORAGE_KEY));
    if (!token || !user) {
      return null;
    }
    return { token, user };
  },
  setSession(session: AuthSession) {
    if (!canUseStorage()) {
      return;
    }
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  },
  clearSession() {
    if (!canUseStorage()) {
      return;
    }
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  },
  getToken() {
    if (!canUseStorage()) {
      return null;
    }
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  },
  setStoredUser(user: AuthUser) {
    if (!canUseStorage()) {
      return;
    }
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authStorage.clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

const mapErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message as string | undefined;
    if (
      status === 401 &&
      message &&
      message !== "Invalid email or password."
    ) {
      return "Session expired. Please login again.";
    }

    return (
      message ??
      error.response?.data?.errors?.[0]?.msg ??
      "Request failed."
    );
  }
  return "Request failed.";
};

const queryFromFilters = (filters: DonationFilters) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  return query.toString();
};

export const authApi = {
  async login(email: string, password: string) {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
        email,
        password,
      });
      const data = response.data.data;
      return {
        token: data.token,
        user: data.user,
      } satisfies AuthSession;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
  async getCurrentUser() {
    try {
      const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
  async updateSignature(signatureDataUrl?: string) {
    try {
      const response = await api.patch<ApiResponse<AuthUser>>("/auth/me/signature", {
        signatureDataUrl: signatureDataUrl ?? null,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};

export const adminApi = {
  async listSubAdmins() {
    try {
      const response = await api.get<ApiResponse<AuthUser[]>>("/sub-admins");
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
  async createSubAdmin(payload: { name: string; email: string; password: string }) {
    try {
      const response = await api.post<ApiResponse<AuthUser>>("/sub-admins", payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
  async deleteSubAdmin(id: string) {
    try {
      await api.delete(`/sub-admins/${id}`);
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};

export const donationApi = {
  async getDonations(filters: DonationFilters = {}) {
    try {
      const query = queryFromFilters(filters);
      const endpoint = query ? `/donations?${query}` : "/donations";
      const response = await api.get<ApiResponse<Donation[]>>(endpoint);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async getStats() {
    try {
      const response = await api.get<ApiResponse<DonationStats>>("/donations/stats");
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async createDonation(payload: DonationInput) {
    try {
      const response = await api.post<ApiResponse<Donation>>("/donations", payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async emailReceipt(donationId: string, email: string) {
    try {
      const response = await api.post<ApiResponse<{ queued: boolean }>>(
        `/donations/${donationId}/receipt/email`,
        { email },
      );
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};

export const contributorApi = {
  async getContributors(search?: string) {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await api.get<ApiResponse<Contributor[]>>(`/contributors${query}`);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async createContributor(payload: ContributorInput) {
    try {
      const response = await api.post<ApiResponse<Contributor>>("/contributors", payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async updateContributor(id: string, payload: ContributorInput) {
    try {
      const response = await api.patch<ApiResponse<Contributor>>(`/contributors/${id}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async deleteContributor(id: string) {
    try {
      await api.delete(`/contributors/${id}`);
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};

export const investmentApi = {
  async getInvestments(search?: string) {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await api.get<ApiResponse<InvestmentListPayload>>(`/investments${query}`);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async createInvestment(payload: InvestmentInput) {
    try {
      const response = await api.post<ApiResponse<Investment>>("/investments", payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async updateInvestment(id: string, payload: InvestmentInput) {
    try {
      const response = await api.patch<ApiResponse<Investment>>(`/investments/${id}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },

  async deleteInvestment(id: string) {
    try {
      await api.delete(`/investments/${id}`);
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};

export const systemApi = {
  async deleteAllData() {
    try {
      const response = await api.delete<
        ApiResponse<{
          donationsDeleted: number;
          investmentsDeleted: number;
          contributorsDeleted: number;
        }>
      >("/system/data");
      return response.data.data;
    } catch (error) {
      throw new Error(mapErrorMessage(error));
    }
  },
};
