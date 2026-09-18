'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { FileUpload } from '@/components/ui/file-upload';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatMoney, titleCase } from '@/lib/format';
import { safeHref } from '@/lib/url';
import type { Deliverable, ProjectStage } from '@/lib/types';

type StageAction = 'start' | 'submit' | 'approve' | 'reject';

export function StageList({
  stages,
  isClient,
  isDesigner,
  onChanged,
}: {
  stages: ProjectStage[];
  isClient: boolean;
  isDesigner: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [openStage, setOpenStage] = useState<string | null>(null);

  async function act(stageId: string, action: StageAction) {
    setError(null);
    setPending(stageId);
    try {
      await api.patch(`/stages/${stageId}/${action}`);
      onChanged();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      {error ? <ErrorNotice message={error} /> : null}

      <ol className="mt-4 flex flex-col gap-4">
        {stages.map((stage) => {
          const busy = pending === stage.id;
          return (
            <li
              key={stage.id}
              className="rounded-card border border-hairline bg-surface p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-sand font-display text-lg font-semibold text-brand">
                    {stage.stageOrder}
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold">
                      {titleCase(stage.name)}
                    </p>
                    <p className="text-sm text-muted">
                      {formatMoney(stage.fee)} · Due {formatDate(stage.dueDate)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={stage.status} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isDesigner && stage.status === 'PENDING' ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act(stage.id, 'start')}
                  >
                    Start stage
                  </Button>
                ) : null}

                {isDesigner && stage.status === 'IN_PROGRESS' ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act(stage.id, 'submit')}
                  >
                    Submit for review
                  </Button>
                ) : null}

                {isClient && stage.status === 'SUBMITTED' ? (
                  <>
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => act(stage.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => act(stage.id, 'reject')}
                    >
                      Request changes
                    </Button>
                  </>
                ) : null}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setOpenStage(openStage === stage.id ? null : stage.id)
                  }
                >
                  {openStage === stage.id ? 'Hide files' : 'Files'}
                </Button>
              </div>

              {openStage === stage.id ? (
                <StageDeliverables
                  stageId={stage.id}
                  canUpload={isDesigner}
                  canGiveFeedback={isClient}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StageDeliverables({
  stageId,
  canUpload,
  canGiveFeedback,
}: {
  stageId: string;
  canUpload: boolean;
  canGiveFeedback: boolean;
}) {
  const [items, setItems] = useState<Deliverable[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Deliverable[] }>(
        `/stages/${stageId}/deliverables`,
      );
      setItems(data.items);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }, [stageId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post(`/stages/${stageId}/deliverables`, {
        fileUrl,
        fileName: fileName || undefined,
        notes: notes || undefined,
      });
      setFileUrl('');
      setFileName('');
      setNotes('');
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function onFeedback(deliverableId: string, feedback: string) {
    setError(null);
    try {
      await api.patch(`/deliverables/${deliverableId}/feedback`, { feedback });
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return (
    <div className="mt-6 border-t border-hairline pt-6">
      {error ? <ErrorNotice message={error} /> : null}

      {items && items.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {items.map((deliverable) => (
            <li key={deliverable.id} className="rounded-card bg-sand p-5">
              <a
                href={safeHref(deliverable.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="link-underline font-semibold"
              >
                {deliverable.fileName ?? deliverable.fileUrl}
              </a>
              {deliverable.notes ? (
                <p className="mt-2 text-sm text-muted">{deliverable.notes}</p>
              ) : null}
              {deliverable.feedback ? (
                <p className="mt-3 rounded-card bg-canvas px-4 py-3 text-sm">
                  <span className="label text-muted">Feedback</span>
                  <span className="mt-1 block">{deliverable.feedback}</span>
                </p>
              ) : canGiveFeedback ? (
                <FeedbackForm
                  onSubmit={(value) => onFeedback(deliverable.id, value)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No files for this stage yet.</p>
      )}

      {canUpload ? (
        <form onSubmit={onUpload} className="mt-6 flex flex-col gap-4">
          <FileUpload
            folder="deliverables"
            accept="image/*,.pdf,.dwg,.dxf,.zip"
            label="File"
            onUploaded={(file) => {
              setFileUrl(file.url);
              setFileName(file.fileName);
            }}
          />
          <Field label="Notes" htmlFor={`notes-${stageId}`}>
            <Textarea
              id={`notes-${stageId}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          <div>
            <Button type="submit" size="sm" disabled={busy || !fileUrl}>
              {busy ? 'Adding…' : 'Add deliverable'}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FeedbackForm({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Leave feedback on this file."
        className="min-h-20"
      />
      <div>
        <Button type="submit" size="sm" variant="outline">
          Send feedback
        </Button>
      </div>
    </form>
  );
}
