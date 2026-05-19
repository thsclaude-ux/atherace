import { useEffect, useRef, useCallback, useState } from "react";
import { apiConditional, type ConditionalResult } from "@/lib/api";

interface UseSmartPollingOptions<T> {
  fetcher: (etag: string | null) => Promise<ConditionalResult<T>>;
  intervalMs?: number;
  enabled?: boolean;
}

export function useSmartPolling<T>({
  fetcher,
  intervalMs = 15000,
  enabled = true,
}: UseSmartPollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const etagRef = useRef<string | null>(null);
  const visibleRef = useRef(typeof document !== "undefined" ? !document.hidden : true);

  const poll = useCallback(async () => {
    if (!visibleRef.current || !enabled) return;
    try {
      const result = await fetcher(etagRef.current);
      if (result.etag) etagRef.current = result.etag;
      if (!result.notModified && result.data !== null) {
        setData(result.data);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetcher, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) poll();
    };

    document.addEventListener("visibilitychange", onVisibility);
    poll();

    const interval = setInterval(poll, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [poll, intervalMs, enabled]);

  return { data, loading, error, refresh: poll };
}

export function createEtagFetcher<T>(path: string, token?: string | null) {
  return (etag: string | null) =>
    apiConditional<T>(path, { token, etag: etag ?? undefined });
}
