import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    // Only the most recent request may update state.
    const request = ++latest.current;
    if (path === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(path);
      if (request === latest.current) setData(result);
    } catch (cause) {
      if (request === latest.current) setError(errorMessage(cause));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
