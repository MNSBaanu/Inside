'use client';

import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { toDateInputValue } from '@/lib/utils/format';
import { buildXlsx, type XlsxCell } from '@/lib/utils/xlsx';

const EXPORT_PAGE_SIZE = 100;
const EXPORT_LIMIT = 5000;

function queryString(filters: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

/** Every item of a paginated admin list, up to the export limit. */
export async function fetchAllPages<T>(
  endpoint: string,
  filters: Record<string, string>,
) {
  const items: T[] = [];
  for (let page = 1; items.length < EXPORT_LIMIT; page++) {
    const params = queryString(filters);
    params.set('page', String(page));
    params.set('pageSize', String(EXPORT_PAGE_SIZE));
    const data = await api.get<{ items: T[]; total: number }>(
      `${endpoint}?${params.toString()}`,
    );
    items.push(...data.items);
    if (data.items.length < EXPORT_PAGE_SIZE || items.length >= data.total) {
      break;
    }
  }
  return items;
}

export async function fetchExport<T>(
  endpoint: string,
  filters: Record<string, string>,
) {
  const params = queryString(filters);
  const { items } = await api.get<{ items: T[] }>(
    `${endpoint}?${params.toString()}`,
  );
  return items;
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function downloadCsv(name: string, header: string[], rows: string[][]) {
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `inside-${name}-${toDateInputValue()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadXlsx(
  name: string,
  header: string[],
  rows: XlsxCell[][],
) {
  const url = URL.createObjectURL(buildXlsx(name, header, rows));
  const link = document.createElement('a');
  link.href = url;
  link.download = `inside-${name}-${toDateInputValue()}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({
  onExport,
  label = 'Export CSV',
}: {
  onExport: () => Promise<void>;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setBusy(true);
    try {
      await onExport();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button size="sm" variant="outline" onClick={onClick} disabled={busy}>
        <Upload aria-hidden className="mr-1.5 h-4 w-4" />
        {busy ? 'Exporting…' : label}
      </Button>
      {error ? <ErrorNotice message={error} /> : null}
    </div>
  );
}
