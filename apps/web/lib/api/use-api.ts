'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './client';

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ path: null, data: null, error: null, loading: false });
  const latest = useRef(0);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      // Only the most recent request may update state.
      const request = ++latest.current;
      if (path === null) return;
      try {
        const result = await api.get<T>(path, { signal });
        if (request === latest.current && !signal?.aborted) {
          setState({ path, data: result, error: null, loading: false });
        }
      } catch (cause) {
        if (request === latest.current && !signal?.aborted) {
          setState((current) => ({
            path,
            data: current.path === path ? current.data : null,
            error: errorMessage(cause),
            loading: false,
          }));
        }
      }
    },
    [path],
  );

  useEffect(() => {
    const requests = latest;
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => {
      controller.abort();
      requests.current++;
    };
  }, [fetchData]);

  const reload = useCallback(async () => {
    if (path === null) return;
    setState((current) => ({
      path,
      data: current.path === path ? current.data : null,
      error: null,
      loading: true,
    }));
    await fetchData();
  }, [path, fetchData]);

  const current = path !== null && state.path === path;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: path !== null && (!current || state.loading),
    reload,
  };
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
