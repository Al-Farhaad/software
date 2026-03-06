import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { donationApi } from "../services/api";
import type { Donation, DonationFilters, DonationInput, DonationStats } from "../types/donation";
import { useDebouncedValue } from "./useDebouncedValue";

export const useDonations = (filters: DonationFilters) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const donationRequestIdRef = useRef(0);
  const debouncedSearch = useDebouncedValue(filters.search ?? "", 300);
  const effectiveFilters = useMemo(
    () => ({
      campaign: filters.campaign,
      from: filters.from,
      to: filters.to,
      search: debouncedSearch || undefined,
    }),
    [filters.campaign, filters.from, filters.to, debouncedSearch],
  );

  const refreshDonations = useCallback(async () => {
    const requestId = donationRequestIdRef.current + 1;
    donationRequestIdRef.current = requestId;
    try {
      setLoading(true);
      setError(null);
      const donationData = await donationApi.getDonations(effectiveFilters);
      if (requestId === donationRequestIdRef.current) {
        setDonations(donationData);
      }
    } catch (requestError) {
      if (requestId === donationRequestIdRef.current) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load donations.");
      }
    } finally {
      if (requestId === donationRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [effectiveFilters]);

  const refreshStats = useCallback(async () => {
    try {
      setError(null);
      const statsData = await donationApi.getStats();
      setStats(statsData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load donation stats.");
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([refreshDonations(), refreshStats()]);
  }, [refreshDonations, refreshStats]);

  const createDonation = useCallback(
    async (payload: DonationInput) => {
      setSubmitting(true);
      setError(null);
      try {
        const donation = await donationApi.createDonation(payload);
        await refreshData();
        return donation;
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not add donation.");
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshData],
  );

  const emailReceipt = useCallback(
    async (donationId: string, email: string) => {
      setError(null);
      try {
        await donationApi.emailReceipt(donationId, email);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not email receipt.");
        throw requestError;
      }
    },
    [],
  );

  useEffect(() => {
    void refreshDonations();
  }, [refreshDonations]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return {
    loading,
    submitting,
    error,
    donations,
    stats,
    refreshData,
    createDonation,
    emailReceipt,
  };
};
