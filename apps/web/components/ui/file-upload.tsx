'use client';

import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { errorMessage } from '@/lib/api/client';
import { uploadFile, type UploadFolder, type UploadedFile } from '@/lib/api/upload';

export function FileUpload({
  folder,
  accept = 'image/*',
  label,
  onUploaded,
  className,
}: {
  folder: UploadFolder;
  accept?: string;
  label: string;
  onUploaded: (file: UploadedFile) => void;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const result = await uploadFile(file, folder);
      setUploaded(result.fileName);
      onUploaded(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="ui-label text-ink/70">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={busy}
        onChange={onChange}
        className="w-full rounded-card border border-dashed border-hairline bg-surface px-4 py-3 text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-brand file:px-4 file:py-2 file:text-label file:font-semibold file:uppercase file:text-canvas hover:file:bg-brand-deep disabled:opacity-60"
      />
      {busy ? <p className="text-sm text-muted">Uploading…</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {!busy && !error && uploaded ? (
        <p className="truncate text-sm text-muted">Uploaded {uploaded}</p>
      ) : null}
    </div>
  );
}
