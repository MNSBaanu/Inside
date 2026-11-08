'use client';

import { cardSurface } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FileUpload } from '@/components/ui/file-upload';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';
import { useApi } from '@/lib/api/use-api';
import type { Deliverable, ProjectStage, Task } from '@/lib/types';

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
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function act(
    stageId: string,
    action: StageAction,
    body?: { reason: string },
  ) {
    setError(null);
    setPending(stageId);
    try {
      await api.patch(`/stages/${stageId}/${action}`, body);
      if (action === 'reject') {
        setRejecting(null);
        setReason('');
      }
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
              className={cn(cardSurface, 'p-6')}
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

                {isDesigner &&
                (stage.status === 'IN_PROGRESS' ||
                  stage.status === 'REJECTED') ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act(stage.id, 'submit')}
                  >
                    {stage.status === 'REJECTED'
                      ? 'Resubmit for review'
                      : 'Submit for review'}
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
                      onClick={() =>
                        setRejecting(rejecting === stage.id ? null : stage.id)
                      }
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

              <StageTasks
                stageId={stage.id}
                canEdit={isDesigner && stage.status !== 'APPROVED'}
              />

              {rejecting === stage.id && stage.status === 'SUBMITTED' ? (
                <form
                  className="mt-4 flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void act(stage.id, 'reject', { reason: reason.trim() });
                  }}
                >
                  <Field
                    label="What needs to change?"
                    htmlFor={`reject-reason-${stage.id}`}
                    hint="The designer sees this feedback with the stage history."
                  >
                    <Textarea
                      id={`reject-reason-${stage.id}`}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      required
                      maxLength={1000}
                    />
                  </Field>
                  <div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={busy || reason.trim().length < 2}
                    >
                      Send feedback
                    </Button>
                  </div>
                </form>
              ) : null}

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
  const {
    data,
    error: loadError,
    loading,
    reload: load,
  } = useApi<{ items: Deliverable[] }>(`/stages/${stageId}/deliverables`);
  const items = data?.items ?? null;
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

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
      {error || loadError ? (
        <ErrorNotice message={error ?? loadError!} />
      ) : null}

      {loading && !items ? (
        <Skeleton className="h-24" />
      ) : items && items.length > 0 ? (
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
                  <span className="ui-label text-muted">Feedback</span>
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
      ) : loadError ? (
        <Button size="sm" variant="outline" onClick={() => void load()}>
          Try again
        </Button>
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

function StageTasks({
  stageId,
  canEdit,
}: {
  stageId: string;
  canEdit: boolean;
}) {
  const {
    data,
    error: loadError,
    reload: load,
  } = useApi<{ items: Task[] }>(`/stages/${stageId}/tasks`);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const items =
    data?.items.map((task) => ({
      ...task,
      isDone: overrides[task.id] ?? task.isDone,
    })) ?? null;
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(taskId: string, isDone: boolean) {
    setError(null);
    setBusy(true);
    setOverrides((current) => ({ ...current, [taskId]: isDone }));
    try {
      await api.patch(`/tasks/${taskId}`, { isDone });
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setOverrides((current) => {
        const next = { ...current };
        delete next[taskId];
        return next;
      });
      setBusy(false);
    }
  }

  const done = items?.filter((task) => task.isDone).length ?? 0;

  return (
    <div className="mt-6 border-t border-hairline pt-6">
      <p className="ui-label text-muted">
        Tasks
        {items && items.length > 0 ? ` · ${done}/${items.length} done` : ''}
      </p>

      {error || loadError ? (
        <div className="mt-3 flex flex-col items-start gap-3">
          <ErrorNotice message={error ?? loadError!} />
          {items === null ? (
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {items === null && !error && !loadError ? (
        <Skeleton className="mt-3 h-12" />
      ) : null}

      {items && items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {canEdit
            ? 'Add the steps you will work through in this stage.'
            : 'No tasks for this stage yet.'}
        </p>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3"
            >
              <label className="flex min-h-11 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.isDone}
                  disabled={!canEdit || busy}
                  onChange={(event) =>
                    void toggle(task.id, event.target.checked)
                  }
                  className="h-4 w-4 accent-brand"
                />
                <span
                  className={cn(
                    'text-sm',
                    task.isDone && 'text-muted line-through',
                  )}
                >
                  {task.title}
                </span>
              </label>
              {canEdit ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`Delete task: ${task.title}`}
                  onClick={() =>
                    void run(() => api.delete(`/tasks/${task.id}`))
                  }
                >
                  Delete
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canEdit ? (
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await api.post(`/stages/${stageId}/tasks`, {
                title: title.trim(),
              });
              setTitle('');
            });
          }}
        >
          <div className="min-w-0 flex-1">
            <Field label="New task" htmlFor={`task-${stageId}`}>
              <Input
                id={`task-${stageId}`}
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={busy || title.trim().length < 2}
          >
            Add task
          </Button>
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
