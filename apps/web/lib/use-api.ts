'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [currentPath, setCurrentPath] = useState(path);
  const latest = useRef(0);

  // A new path starts loading in the same render, not after an effect.
  if (path !== currentPath) {
    setCurrentPath(path);
    setLoading(path !== null);
    setError(null);
  }

  // State is only set in the promise callbacks, and only by the latest request.
  const fetchPath = useCallback((): Promise<void> => {
    const request = ++latest.current;
    if (path === null) return Promise.resolve();
    return api.get<T>(path).then(
      (result) => {
        if (request !== latest.current) return;
        setData(result);
        setLoading(false);
      },
      (cause: unknown) => {
        if (request !== latest.current) return;
        setError(errorMessage(cause));
        setLoading(false);
      },
    );
  }, [path]);

  useEffect(() => {
    void fetchPath();
  }, [fetchPath]);

  const reload = useCallback(async () => {
    if (path === null) return;
    setLoading(true);
    setError(null);
    await fetchPath();
  }, [path, fetchPath]);

  return { data, error, loading, reload };
}

export function buildQuery(
  params: Record<string, string | number | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
