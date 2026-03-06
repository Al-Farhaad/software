import { useCallback, useEffect, useRef, useState } from "react";
import { contributorApi } from "../services/api";
import type { Contributor, ContributorInput } from "../types/contributor";

export const useContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  const refreshContributors = useCallback(async (search?: string) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      setLoading(true);
      setError(null);
      const nextSearch = search === undefined ? searchRef.current : search;
      searchRef.current = nextSearch;
      const data = await contributorApi.getContributors(nextSearch);
      if (requestId === requestIdRef.current) {
        setContributors(data);
      }
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(
          requestError instanceof Error ? requestError.message : "Failed to load contributors.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const createContributor = useCallback(
    async (payload: ContributorInput) => {
      try {
        setSubmitting(true);
        setError(null);
        await contributorApi.createContributor(payload);
        await refreshContributors();
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Could not create contributor.",
        );
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshContributors],
  );

  const updateContributor = useCallback(
    async (id: string, payload: ContributorInput) => {
      try {
        setSubmitting(true);
        setError(null);
        await contributorApi.updateContributor(id, payload);
        await refreshContributors();
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Could not update contributor.",
        );
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshContributors],
  );

  const deleteContributor = useCallback(
    async (id: string) => {
      try {
        setSubmitting(true);
        setError(null);
        await contributorApi.deleteContributor(id);
        await refreshContributors();
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Could not delete contributor.",
        );
        throw requestError;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshContributors],
  );

  useEffect(() => {
    void refreshContributors();
  }, [refreshContributors]);

  return {
    contributors,
    loading,
    submitting,
    error,
    refreshContributors,
    createContributor,
    updateContributor,
    deleteContributor,
  };
};
