// src/hooks/useApi.js
import { useState, useRef } from "react";
import useAxiosSecure from "./useAxiosSecure";
import { toast } from "sonner";

const cacheStore = new Map();
const getCacheKey = (url, method, data) =>
  `${method}:${url}:${JSON.stringify(data)}`;

export default function useApi() {
  const { axiosSecure } = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortRef = useRef(null);

  const request = async (
    url,
    method = "GET",
    payload = {},
    {
      cacheDuration = 60 * 1000,
      retries = 0,
      delay = 1000,
      useToast = true,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      onFinally,
      config = {},
    } = {}
  ) => {
    setLoading(true);
    setError(null);

    const cacheKey = getCacheKey(url, method, payload);
    const cached = cacheStore.get(cacheKey);
    if (cached && Date.now() - cached.time < cacheDuration) {
      setData(cached.data);
      setLoading(false);
      return cached.data;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const attempt = async () => {
      return axiosSecure({
        url,
        method,
        data: ["GET", "DELETE"].includes(method) ? undefined : payload,
        params: ["GET", "DELETE"].includes(method) ? payload : undefined,
        signal,
        ...config,
      });
    };

    try {
      const res = await autoRetryRequest(attempt, retries, delay);
      console.log('rre',res)
      const resData = res?.data;

      cacheStore.set(cacheKey, { data: resData, time: Date.now() });
      setData(resData);
      if (onSuccess) onSuccess(resData);

      // ✅ smart toast message detection
      if (useToast) {
        const msg = resData?.message || successMessage;
        if (msg) toast.success(msg);
      }

      return resData;
    } catch (err) {
      setError(err);
      if (onError) onError(err);

      // ✅ detect message from error.response
      if (useToast) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          errorMessage ||
          "Something went wrong!";
        toast.error(msg);
      }

      throw err;
    } finally {
      setLoading(false);
      if (onFinally) onFinally();
    }
  };

  const cancelRequest = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  return { request, cancelRequest, loading, error, data };
}

// 🔁 helper for retry
async function autoRetryRequest(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay * (i + 1)));
    }
  }
}
