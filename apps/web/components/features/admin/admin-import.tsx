'use client';

import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { parseCsv } from '@/lib/utils/csv';

export type ImportColumn = {
  key: string;
  header: string;
  required?: boolean;
  example: string;
};

type ImportResult = {
  created: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export const USER_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name', header: 'Name', required: true, example: 'Nimali Perera' },
  { key: 'email', header: 'Email', required: true, example: 'nimali@example.com' },
  { key: 'role', header: 'Role', required: true, example: 'Client' },
];

export const PRODUCT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name', header: 'Name', required: true, example: 'Oak lounge sofa' },
  { key: 'description', header: 'Description', required: true, example: 'Three-seater sofa in solid oak with linen cushions.' },
  { key: 'category', header: 'Category', required: true, example: 'Sofas' },
  { key: 'style', header: 'Style', example: 'Japandi' },
  { key: 'price', header: 'Price', required: true, example: '185000' },
  { key: 'imageUrl', header: 'Image URL', required: true, example: 'https://res.cloudinary.com/your-cloud/image/upload/sofa.jpg' },
  { key: 'sellerName', header: 'Seller name', required: true, example: 'Damro' },
  { key: 'sellerUrl', header: 'Seller URL', required: true, example: 'https://www.example.com/oak-sofa' },
  { key: 'isPublished', header: 'Published', example: 'Yes' },
];

export const SUBSCRIBER_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'email', header: 'Email', required: true, example: 'reader@example.com' },
];

const BATCH_SIZE = 100;
const MAX_ROWS = 500;

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadTemplate(name: string, columns: ImportColumn[]) {
  const csv = [columns.map((c) => c.header), columns.map((c) => c.example)]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `inside-${name}-import-template.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportButton({
  name,
  title,
  endpoint,
  columns,
  note,
  onDone,
}: {
  name: string;
  title: string;
  endpoint: string;
  columns: ImportColumn[];
  note?: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Download aria-hidden className="mr-1.5 h-4 w-4" />
        Import
      </Button>
      {open ? (
        <ImportDialog
          name={name}
          title={title}
          endpoint={endpoint}
          columns={columns}
          note={note}
          onClose={() => setOpen(false)}
          onDone={onDone}
        />
      ) : null}
    </>
  );
}

function ImportDialog({
  name,
  title,
  endpoint,
  columns,
  note,
  onClose,
  onDone,
}: {
  name: string;
  title: string;
  endpoint: string;
  columns: ImportColumn[];
  note?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, onClose]);

  async function onFile(file: File | undefined) {
    setError(null);
    setResult(null);
    setRows(null);
    if (!file) return;
    setFileName(file.name);
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) {
      setError('The file has no data rows. Use the template as a starting point.');
      return;
    }
    const headers = parsed[0].map(normalise);
    const index = new Map<string, number>();
    for (const column of columns) {
      const position = headers.findIndex(
        (header) => header === normalise(column.header) || header === normalise(column.key),
      );
      if (position >= 0) index.set(column.key, position);
    }
    const missing = columns.filter((c) => c.required && !index.has(c.key));
    if (missing.length > 0) {
      setError(`Missing column: ${missing.map((c) => c.header).join(', ')}.`);
      return;
    }
    const data = parsed.slice(1).map((cells) =>
      Object.fromEntries(
        columns.map((c) => [c.key, (cells[index.get(c.key) ?? -1] ?? '').trim()]),
      ),
    );
    if (data.length > MAX_ROWS) {
      setError(`Import up to ${MAX_ROWS} rows at a time. This file has ${data.length}.`);
      return;
    }
    setRows(data);
  }

  async function run() {
    if (!rows) return;
    setBusy(true);
    setError(null);
    const total: ImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };
    try {
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = await api.post<ImportResult>(endpoint, {
          rows: rows.slice(start, start + BATCH_SIZE),
        });
        total.created += batch.created;
        total.skipped += batch.skipped;
        total.failed += batch.failed;
        total.errors.push(
          ...batch.errors.map((e) => ({ ...e, row: e.row + start })),
        );
      }
      setResult(total);
      onDone();
    } catch (cause) {
      setResult(total);
      setError(errorMessage(cause));
      if (total.created > 0) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-card bg-surface p-6 shadow-lift"
      >
        <h2 id="import-title" className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted">
          Upload a CSV file with a header row. Required columns:{' '}
          {columns.filter((c) => c.required).map((c) => c.header).join(', ')}.
          {note ? ` ${note}` : ''}
        </p>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => downloadTemplate(name, columns)}>
            <Download aria-hidden className="mr-1.5 h-4 w-4" />
            Download template
          </Button>
        <input
          ref={input}
          type="file"
          accept=".csv,text/csv"
          className="min-w-0 flex-1 text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-canvas file:transition-colors hover:file:bg-brand-deep disabled:opacity-60"
          aria-label="CSV file"
          onChange={(event) => void onFile(event.target.files?.[0])}
          disabled={busy}
        />
        </div>
        {error ? <ErrorNotice message={error} /> : null}
        {rows && !result ? (
          <p className="text-sm">
            <span className="font-medium">{rows.length}</span> row
            {rows.length === 1 ? '' : 's'} found in {fileName}.
          </p>
        ) : null}

        {result ? (
          <div className="rounded-card bg-sand p-4 text-sm">
            <p>
              <span className="font-semibold">{result.created}</span> added ·{' '}
              <span className="font-semibold">{result.skipped}</span> skipped (already exist) ·{' '}
              <span className="font-semibold">{result.failed}</span> failed
            </p>
            {result.errors.length > 0 ? (
              <ul className="mt-3 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-ink/80">
                {result.errors.map((item) => (
                  <li key={`${item.row}-${item.message}`}>
                    Row {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result ? (
            <Button onClick={() => void run()} disabled={!rows || busy}>
              {busy ? 'Importing…' : 'Import'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
