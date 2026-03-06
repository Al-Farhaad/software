import axios from "axios";
import type { Donation, DonationFilters, DonationInput, DonationStats } from "../types/donation";
import type { Contributor, ContributorInput } from "../types/contributor";
import type { Investment, InvestmentInput, InvestmentListPayload } from "../types/investment";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const mapErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
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
