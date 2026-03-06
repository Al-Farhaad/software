import { useCallback, useEffect, useRef, useState } from "react";
import { investmentApi } from "../services/api";
import type { Investment, InvestmentInput } from "../types/investment";

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  const refreshInvestments = useCallback(async (search?: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      setLoading(true);
      setError(null);
      const nextSearch = search === undefined ? searchRef.current : search;
      searchRef.current = nextSearch;
      const payload = await investmentApi.getInvestments(nextSearch);
      if (requestId === requestIdRef.current) {
        setInvestments(payload.investments);
        setTotalInvested(payload.totalInvested);
      }
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load investments.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const createInvestment = useCallback(
    async (payload: InvestmentInput) => {
      try {
        setSubmitting(true);
        setError(null);
        await investmentApi.createInvestment(payload);
        await refreshInvestments();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not add investment.");
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshInvestments],
  );

  const updateInvestment = useCallback(
    async (id: string, payload: InvestmentInput) => {
      try {
        setSubmitting(true);
        setError(null);
        await investmentApi.updateInvestment(id, payload);
        await refreshInvestments();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not update investment.");
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshInvestments],
  );

  const deleteInvestment = useCallback(
    async (id: string) => {
      try {
        setSubmitting(true);
        setError(null);
        await investmentApi.deleteInvestment(id);
        await refreshInvestments();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Could not delete investment.");
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshInvestments],
  );

  useEffect(() => {
    void refreshInvestments();
  }, [refreshInvestments]);

  return {
    investments,
    totalInvested,
    loading,
    submitting,
    error,
    refreshInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
  };
};
