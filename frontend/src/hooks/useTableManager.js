// hooks/useTableManager.js
import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "./useAxiosSecure";

export default function useTableManager(route, options = {}) {
  const {
    queryKey,
    initialQuery = { page: 1, limit: 10 },
    transform,
    staleTime = 30_000,
    onError,
    enabled = true, // 🔥 KEY ADDITION
    keepPreviousData = true,
  } = options;

  const { axiosSecure } = useAxiosSecure();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ===============================
     Build query from URL
  =============================== */
  const query = useMemo(() => {
    return {
      ...initialQuery,
      ...Object.fromEntries(searchParams),
    };
  }, [searchParams, initialQuery]);

  /* ===============================
     URL synced setters
  =============================== */
  const setQuery = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams);

      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
        if (key !== "page") params.set("page", 1);
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetQuery = useCallback(() => {
    setSearchParams(initialQuery, { replace: true });
  }, [initialQuery, setSearchParams]);

  /* ===============================
     Fetch (SAFE)
  =============================== */
  const fetchData = async () => {
    if (!route) return null; // 🛑 HARD STOP

    try {
      const res = await axiosSecure.get(route, { params: query });
      return transform ? transform(res.data) : res.data;
    } catch (err) {
      // 🔥 Normalize error (ERP friendly)
      const errorPayload = {
        message:
          err?.response?.data?.message || err?.message || "Network error",
        status: err?.response?.status || 500,
      };

      throw errorPayload;
    }
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKey ? [queryKey, query] : [route, query],
    queryFn: fetchData,
    enabled: enabled && !!route, // 🔥 THIS SOLVES YOUR ISSUE
    keepPreviousData,
    staleTime,
    onError,
  });

  /* ===============================
     NORMALIZED RETURN
  =============================== */
  return {
    rows: data?.data || [],
    pagination: data?.pagination || {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      totalPages: 1,
      total: 0,
    },
    loading: isLoading || isFetching,
    error,
    query,
    setQuery,
    resetQuery,
    refetch,
  };
}
