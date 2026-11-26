'use client';

import { CheckCircle2, Circle, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Textarea } from '@/components/ui/field';
import { FileUpload, type HashedUpload } from '@/components/ui/file-upload';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import { IconButton } from '@/components/ui/icon-button';
import { safeHref } from '@/lib/utils/url';
import type { Deliverable, StageRequirement, StageStatus } from '@/lib/types';

const isImage = (url: string, fileName?: string | null) =>
  /\.(jpe?g|png|webp|gif|avif)$/i.test(url.split('?')[0]) ||
  /\.(jpe?g|png|webp|gif|avif)$/i.test(fileName ?? '');

export function StageRequirements({
  stageId,
  status,
  submittedAt,
  editable,
  onOpenWorkLog,
  onChanged,
}: {
  stageId: string;
  status: StageStatus;
  submittedAt: string | null;
  editable: boolean;
  onOpenWorkLog: () => void;
  onChanged: () => void;
}) {
  const requirements = useApi<{ items: StageRequirement[]; applies: boolean }>(
    `/stages/${stageId}/requirements`,
  );
  const files = useApi<{ items: Deliverable[] }>(
    status === 'PENDING' ? null : `/stages/${stageId}/deliverables`,
  );
  useSocketEvent('notification:new', () => {
    void requirements.refresh();
    if (status !== 'PENDING') void files.refresh();
  });
  const [error, setError] = useState<string | null>(null);

  const items = requirements.data?.items;
  if (requirements.loading && !items) return <Skeleton className="mt-4 h-24" />;
  if (!items) {
    return requirements.error ? (
      <div className="mt-4">
        <ErrorNotice message={requirements.error} />
      </div>
    ) : null;
  }

  const ready = items.filter((item) => item.done).length;
  const allFiles = files.data?.items ?? [];

  if (status === 'APPROVED' && ready === 0) return null;
  if (status === 'PENDING') {
    return (
      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-ink/80">Needs: </span>
        {items.map((item) => item.label).join(' · ')}
      </p>
    );
  }

  async function refresh() {
    await Promise.all([requirements.refresh(), files.refresh()]);
    onChanged();
  }

  async function upload(key: string, uploads: HashedUpload[]) {
    setError(null);
    const failed: string[] = [];
    for (const file of uploads) {
      try {
        await api.post(`/stages/${stageId}/deliverables`, {
          fileUrl: file.url,
          fileName: file.fileName || undefined,
          fileHash: file.fileHash,
          requirement: key,
        });
      } catch (cause) {
        failed.push(`${file.fileName}: ${errorMessage(cause)}`);
      }
    }
    if (failed.length) setError(failed.join(' '));
    await refresh();
  }

  async function removeFile(id: string) {
    setError(null);
    try {
      await api.delete(`/deliverables/${id}`);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function saveText(key: string, text: string) {
    setError(null);
    try {
      await api.put(`/stages/${stageId}/requirements/${key}`, { text });
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <section className="mt-4 border-t border-hairline pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="ui-label text-muted">What this stage needs</p>
        <span className="text-sm font-semibold text-brand">
          {ready}/{items.length} ready
        </span>
      </div>
      {requirements.data?.applies === false ? (
        <p className="mt-2 text-sm text-muted">
          This stage began before these items were required, so they are
          optional here.
        </p>
      ) : null}
      {error ? (
        <div className="mt-3">
          <ErrorNotice message={error} />
        </div>
      ) : null}
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.key} className="rounded-card bg-sand/60 px-4 py-3">
            <div className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                />
              ) : (
                <Circle
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {item.label}
                  {item.kind === 'FILES' && item.min ? (
                    <span className="ml-2 text-sm font-normal text-muted">
                      {item.count}/{item.min}
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {item.done ? ' (done)' : ' (not done yet)'}
                  </span>
                </p>
                <p className="text-sm text-muted">{item.hint}</p>

                {item.kind === 'FILES' ? (
                  <RequirementFiles
                    files={allFiles.filter((file) => file.requirement === item.key)}
                    canRemove={(file) =>
                      editable &&
                      (!submittedAt ||
                        (file.uploadedAt ?? '') > submittedAt)
                    }
                    onRemove={(id) => void removeFile(id)}
                  />
                ) : null}
                {item.kind === 'FILES' && editable ? (
                  <FileUpload
                    className="mt-3"
                    folder="deliverables"
                    accept={
                      item.imagesOnly ? 'image/*' : 'image/*,.pdf,.dwg,.dxf,.zip'
                    }
                    label={`Add ${item.label.toLowerCase()}${item.imagesOnly ? ' (photos only)' : ''}`}
                    existingHashes={allFiles.flatMap((file) =>
                      file.fileHash ? [file.fileHash] : [],
                    )}
                    onUploadedMany={(uploads) => void upload(item.key, uploads)}
                  />
                ) : null}

                {item.kind === 'TEXT' ? (
                  editable ? (
                    <RequirementText
                      id={`${stageId}-${item.key}`}
                      label={item.label}
                      initial={item.text ?? ''}
                      onSave={(text) => saveText(item.key, text)}
                    />
                  ) : item.text ? (
                    <p className="mt-2 whitespace-pre-line rounded-card bg-canvas px-4 py-3 text-sm">
                      {item.text}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted">Not added yet.</p>
                  )
                ) : null}

                {item.kind === 'WORKLOG' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-sm">
                      {item.done
                        ? 'Logged and confirmed in the Work log.'
                        : 'Not confirmed yet.'}
                    </p>
                    <Button size="sm" variant="outline" onClick={onOpenWorkLog}>
                      Open Work log
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequirementFiles({
  files,
  canRemove,
  onRemove,
}: {
  files: Deliverable[];
  canRemove: (file: Deliverable) => boolean;
  onRemove: (id: string) => void;
}) {
  if (!files.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {files.map((file) => (
        <li key={file.id} className="relative">
          <a
            href={safeHref(file.fileUrl)}
            target="_blank"
            rel="noreferrer"
            title={file.fileName ?? undefined}
            className="block"
          >
            {isImage(file.fileUrl, file.fileName) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.fileUrl}
                alt={file.fileName ?? 'Uploaded image'}
                className="h-20 w-20 rounded-card object-cover"
              />
            ) : (
              <span className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-card bg-canvas px-2 text-center text-xs text-muted">
                <FileText aria-hidden className="h-5 w-5 text-brand" />
                <span className="w-full truncate">{file.fileName ?? 'File'}</span>
              </span>
            )}
          </a>
          {canRemove(file) ? (
            <IconButton
              action="delete"
              label={`Remove ${file.fileName ?? 'file'}`}
              onClick={() => onRemove(file.id)}
              className="absolute -right-2 -top-2 bg-canvas shadow-lift"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function RequirementText({
  id,
  label,
  initial,
  onSave,
}: {
  id: string;
  label: string;
  initial: string;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const changed = text.trim() !== initial.trim();
  return (
    <div className="mt-3 flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Textarea
        id={id}
        value={text}
        maxLength={5000}
        onChange={(event) => setText(event.target.value)}
        className="min-h-24 bg-canvas"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!changed || saving}
          onClick={() => {
            setSaving(true);
            void onSave(text).finally(() => setSaving(false));
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
