import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "../api/client";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Runs `fetcher` whenever `deps` change, tracking loading/error state. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (id === requestId.current) setData(res);
      })
      .catch((err) => {
        if (id === requestId.current) {
          setError(err instanceof ApiError ? err.message : "حدث خطأ غير متوقع");
        }
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
