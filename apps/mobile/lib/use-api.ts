import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api';

export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ path: null, data: null, error: null, loading: false });
  const latest = useRef(0);

  const fetchData = useCallback(async () => {
    // Only the most recent request may update state.
    const request = ++latest.current;
    if (path === null) return;
    try {
      const result = await api.get<T>(path);
      if (request === latest.current) {
        setState({ path, data: result, error: null, loading: false });
      }
    } catch (cause) {
      if (request === latest.current) {
        setState((current) => ({
          path,
          data: current.path === path ? current.data : null,
          error: errorMessage(cause),
          loading: false,
        }));
      }
    }
  }, [path]);

  useEffect(() => {
    const requests = latest;
    void fetchData();
    return () => {
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
