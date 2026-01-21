import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "./useAxiosSecure";

export default function useTableManager(route, options = {}) {
  const {
    queryKey = "table",
    initialQuery = {},
    transform,
    onError,
    staleTime = 30_000,
  } = options;

  const { axiosSecure } = useAxiosSecure();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(
    () => ({ ...initialQuery, ...Object.fromEntries(searchParams) }),
    [searchParams, initialQuery]
  );

const setQuery = useCallback(
  (key, value) => {
    const params = new URLSearchParams(searchParams);

    if (value === undefined || value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);

      if (key !== "page") {
        params.set("page", 1);
      }
    }

    setSearchParams(params);
  },
  [searchParams, setSearchParams]
);


  const fetchData = useCallback(async () => {
    const res = await axiosSecure.get(route, { params: query });
    return transform ? transform(res.data) : res.data;
  }, [axiosSecure, route, query, transform]);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: [queryKey, query],
    queryFn: fetchData,
    keepPreviousData: true,
    staleTime,
    onError,
  });

  return {
    data,
    loading: isLoading,
    error,
    query,
    setQuery,
    refetch,
  };
}
