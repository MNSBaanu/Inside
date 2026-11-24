'use client';

import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { errorMessage } from '@/lib/api/client';
import { uploadFile, type UploadFolder, type UploadedFile } from '@/lib/api/upload';

const MAX_BYTES = 10 * 1024 * 1024;

export type HashedUpload = UploadedFile & { fileHash: string };

async function hashOf(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Uploads one file, or with `onUploadedMany` several at once. Files whose
 * contents match `existingHashes`, or each other, are skipped.
 */
export function FileUpload({
  folder,
  accept = 'image/*',
  label,
  onUploaded,
  onUploadedMany,
  existingHashes,
  className,
}: {
  folder: UploadFolder;
  accept?: string;
  label: string;
  onUploaded?: (file: UploadedFile) => void;
  onUploadedMany?: (files: HashedUpload[]) => void;
  existingHashes?: string[];
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const multiple = Boolean(onUploadedMany);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploaded(null);

    const tooLarge = files.filter((file) => file.size > MAX_BYTES);
    const seen = new Set(existingHashes);
    const queue: { file: File; fileHash: string }[] = [];
    let duplicates = 0;
    setProgress('Checking files…');
    for (const file of files.filter((entry) => entry.size <= MAX_BYTES)) {
      const fileHash = await hashOf(file);
      if (seen.has(fileHash)) {
        duplicates += 1;
      } else {
        seen.add(fileHash);
        queue.push({ file, fileHash });
      }
    }

    const done: HashedUpload[] = [];
    const failed: string[] = [];
    const totalBytes = queue.reduce((sum, entry) => sum + entry.file.size, 0) || 1;
    let sentBytes = 0;
    for (const [index, { file, fileHash }] of queue.entries()) {
      const label =
        queue.length > 1 ? `Uploading ${index + 1} of ${queue.length}` : `Uploading ${file.name}`;
      setProgress(label);
      setPercent(Math.round((sentBytes / totalBytes) * 100));
      try {
        const result = await uploadFile(file, folder, (fraction) =>
          setPercent(Math.round(((sentBytes + fraction * file.size) / totalBytes) * 100)),
        );
        done.push({ ...result, fileHash });
        onUploaded?.(result);
      } catch (cause) {
        failed.push(`${file.name}: ${errorMessage(cause)}`);
      }
      sentBytes += file.size;
    }
    setPercent(null);
    if (done.length > 0) onUploadedMany?.(done);

    const notes = [
      tooLarge.length ? `${plural(tooLarge.length, 'file')} over 10 MB skipped.` : '',
      duplicates
        ? `${plural(duplicates, 'file')} already added, so ${duplicates === 1 ? 'it was' : 'they were'} skipped.`
        : '',
      ...failed,
    ].filter(Boolean);
    setError(notes.length ? notes.join(' ') : null);
    setUploaded(
      done.length === 1 ? done[0].fileName : done.length > 1 ? plural(done.length, 'file') : null,
    );
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
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
        multiple={multiple}
        disabled={progress !== null}
        onChange={onChange}
        className="w-full rounded-card border border-dashed border-hairline bg-surface px-4 py-3 text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-label file:font-semibold file:uppercase file:text-canvas hover:file:bg-brand-deep disabled:opacity-60"
      />
      {progress ? (
        <div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span className="truncate">{progress}</span>
            {percent !== null ? <span className="tabular-nums">{percent}%</span> : null}
          </div>
          {percent !== null ? (
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {!progress && uploaded ? (
        <p className="truncate text-sm text-muted">Uploaded {uploaded}</p>
      ) : null}
    </div>
  );
}
