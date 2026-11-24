'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated } from '@/lib/types';
import { buildQuery, useApi } from './use-api';

export function usePagedSearch<T, F extends Record<string, string>>(
  endpoint: string,
  initialFilters: F,
  pageSize: number,
) {
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const result = useApi<Paginated<T>>(
    `${endpoint}${buildQuery({ ...applied, page, pageSize })}`,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setApplied(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  function showPage(next: number) {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const totalPages = result.data
    ? Math.max(1, Math.ceil(result.data.total / pageSize))
    : 1;

  return { ...result, filters, setFilters, page, showPage, totalPages, resultsRef };
}
