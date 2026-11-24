'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { PortfolioDraft, Project } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import { isOptimizableImage } from '@/lib/utils/images';
import { ROOM_TYPES, STYLES } from '@/lib/utils/options';

/** Lets the designer feature a completed project in their portfolio once the client approves. */
export function PortfolioShare({
  project,
  isClient,
  isDesigner,
  onChanged,
}: {
  project: Project;
  isClient: boolean;
  isDesigner: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const status = project.portfolioShare;
  const designerName = project.designer?.name ?? 'Your designer';
  const clientName = project.client?.name ?? 'The client';

  if (project.status !== 'COMPLETED' || (isClient && !status)) return null;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function answer(approve: boolean) {
    const ok = await confirm({
      title: approve ? 'Allow this in their portfolio?' : 'Decline this request?',
      description: approve
        ? `${designerName} can publish this project with your name hidden. This decision is final.`
        : `${designerName} will not be able to feature this project. This decision is final.`,
      confirmLabel: approve ? 'Allow' : 'Decline',
      tone: approve ? 'default' : undefined,
    });
    if (ok) {
      await run(() =>
        api.patch(`/projects/${project.id}/portfolio-share`, { approve }),
      );
    }
  }

  let body: React.ReactNode = null;
  if (isDesigner) {
    if (!status) {
      body = (
        <>
          <p className="text-sm text-muted">
            Show this project in your portfolio. {clientName} has to approve
            first, and their name is never shown.
          </p>
          <Button
            className="mt-4"
            disabled={busy}
            onClick={() =>
              void run(() => api.post(`/projects/${project.id}/portfolio-share`))
            }
          >
            {busy ? 'Asking…' : 'Ask to add to portfolio'}
          </Button>
        </>
      );
    } else if (status === 'PENDING') {
      body = (
        <p className="text-sm text-muted">
          Waiting for {clientName} to approve.
        </p>
      );
    } else if (status === 'DECLINED') {
      body = (
        <p className="text-sm text-muted">
          {clientName} chose not to share this project.
        </p>
      );
    } else if (project.portfolioId) {
      body = (
        <>
          <p className="text-sm text-muted">This project is in your portfolio.</p>
          <ButtonLink
            href={`/portfolios/${project.portfolioId}`}
            variant="outline"
            className="mt-4"
          >
            View portfolio entry
          </ButtonLink>
        </>
      );
    } else {
      body = <DraftLoader projectId={project.id} onPublished={onChanged} />;
    }
  } else if (isClient) {
    if (status === 'PENDING') {
      body = (
        <>
          <p className="text-sm text-muted">
            {designerName} would like to show this project in their portfolio.
            Your name will not be shown. Your answer is final.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void answer(true)}>
              Allow
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void answer(false)}
            >
              Decline
            </Button>
          </div>
        </>
      );
    } else {
      body = (
        <p className="text-sm text-muted">
          {status === 'APPROVED'
            ? `You allowed ${designerName} to show this project in their portfolio.`
            : 'You chose not to share this project.'}
        </p>
      );
    }
  }

  if (!body) return null;

  return (
    <Card className="mt-6">
      {dialog}
      <CardHeader title="Portfolio" />
      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}
      {body}
    </Card>
  );
}

function DraftLoader({
  projectId,
  onPublished,
}: {
  projectId: string;
  onPublished: () => void;
}) {
  const { data, error, loading } = useApi<{ draft: PortfolioDraft }>(
    `/projects/${projectId}/portfolio-draft`,
  );
  if (loading) return <Skeleton className="h-40" />;
  if (error || !data) return <ErrorNotice message={error ?? 'Could not load the draft'} />;
  return (
    <DraftForm projectId={projectId} draft={data.draft} onPublished={onPublished} />
  );
}

function DraftForm({
  projectId,
  draft,
  onPublished,
}: {
  projectId: string;
  draft: PortfolioDraft;
  onPublished: () => void;
}) {
  const [form, setForm] = useState({
    title: draft.title,
    description: draft.description,
    style: draft.style,
    roomType: draft.roomType,
    budget: draft.budget !== null ? String(draft.budget) : '',
  });
  const [images, setImages] = useState(draft.images);
  const [uploadedHashes, setUploadedHashes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(
    draft.images.map((image) => image.imageUrl),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(url: string) {
    setSelected((current) =>
      current.includes(url)
        ? current.filter((item) => item !== url)
        : [...current, url],
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selected.length === 0) {
      setError('Choose at least one photo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/portfolios', {
        title: form.title,
        description: form.description || undefined,
        style: form.style,
        roomType: form.roomType,
        ...(form.budget ? { budget: Number(form.budget) } : {}),
        projectId,
        images: selected.map((imageUrl) => ({ imageUrl })),
      });
      onPublished();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        The client approved. Check the details, choose the photos, and publish.
        The client&apos;s name is not shown.
      </p>
      {error ? <ErrorNotice message={error} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="share-title">
          <Input
            id="share-title"
            required
            minLength={2}
            maxLength={160}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </Field>
        <Field label="Budget" htmlFor="share-budget" hint="Optional, in LKR.">
          <Input
            id="share-budget"
            type="number"
            min={0}
            value={form.budget}
            onChange={(event) => setForm({ ...form, budget: event.target.value })}
          />
        </Field>
        <Field label="Style" htmlFor="share-style">
          <Combobox
            id="share-style"
            value={form.style}
            options={STYLES}
            onChange={(style) => setForm({ ...form, style })}
            placeholder="Tropical Modern"
          />
        </Field>
        <Field label="Room type" htmlFor="share-room">
          <Combobox
            id="share-room"
            value={form.roomType}
            options={ROOM_TYPES}
            onChange={(roomType) => setForm({ ...form, roomType })}
            placeholder="Living Room"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="ui-label mb-3 text-ink/70">Photos</legend>
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image) => {
              const on = selected.includes(image.imageUrl);
              return (
                <button
                  key={image.imageUrl}
                  type="button"
                  onClick={() => toggle(image.imageUrl)}
                  aria-pressed={on}
                  title={image.name ?? undefined}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-[10px] border-2 transition-opacity',
                    on ? 'border-brand' : 'border-transparent opacity-50',
                  )}
                >
                  <Image
                    src={image.imageUrl}
                    unoptimized={!isOptimizableImage(image.imageUrl)}
                    alt={image.name ?? ''}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No photos were found in the deliverables. Upload one below.
          </p>
        )}
        <div className="mt-3">
          <FileUpload
            folder="portfolios"
            label="Add photos"
            existingHashes={uploadedHashes}
            onUploadedMany={(files) => {
              setUploadedHashes((current) => [...current, ...files.map((file) => file.fileHash)]);
              setImages((current) => [
                ...current,
                ...files.map((file) => ({ imageUrl: file.url, name: null })),
              ]);
              setSelected((current) => [...current, ...files.map((file) => file.url)]);
            }}
          />
        </div>
      </fieldset>

      <Field label="Description" htmlFor="share-description">
        <Textarea
          id="share-description"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish to portfolio'}
        </Button>
      </div>
    </form>
  );
}
