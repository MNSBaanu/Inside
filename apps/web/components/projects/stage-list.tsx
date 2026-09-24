'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { FileUpload } from '@/components/ui/file-upload';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, titleCase } from '@/lib/format';
import { safeHref } from '@/lib/url';
import type { Deliverable, ProjectStage, Task } from '@/lib/types';

type StageAction = 'start' | 'submit' | 'approve' | 'reject';

export function StageList({
  stages,
  currentStage,
  projectActive,
  isClient,
  isDesigner,
  onChanged,
}: {
  stages: ProjectStage[];
  currentStage: ProjectStage['name'];
  /** Stage work is only possible while the project is active. */
  projectActive: boolean;
  isClient: boolean;
  isDesigner: boolean;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [editingDue, setEditingDue] = useState<string | null>(null);
  const designerCanAct = isDesigner && projectActive;
  const clientCanAct = isClient && projectActive;

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
                {designerCanAct &&
                stage.status === 'PENDING' &&
                stage.name === currentStage ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => act(stage.id, 'start')}
                  >
                    Start stage
                  </Button>
                ) : null}

                {designerCanAct &&
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

                {clientCanAct && stage.status === 'SUBMITTED' ? (
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

                {(isClient || isDesigner) &&
                projectActive &&
                stage.status !== 'APPROVED' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEditingDue(editingDue === stage.id ? null : stage.id)
                    }
                  >
                    Change due date
                  </Button>
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

              {editingDue === stage.id ? (
                <StageDueDate
                  stage={stage}
                  onSaved={() => {
                    setEditingDue(null);
                    onChanged();
                  }}
                />
              ) : null}

              <StageTasks
                stageId={stage.id}
                canEdit={designerCanAct && stage.status !== 'APPROVED'}
              />

              {clientCanAct &&
              rejecting === stage.id &&
              stage.status === 'SUBMITTED' ? (
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
                  canUpload={
                    designerCanAct &&
                    (stage.status === 'IN_PROGRESS' ||
                      stage.status === 'REJECTED')
                  }
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

/** Either party can move a stage's due date until it is approved. */
function StageDueDate({
  stage,
  onSaved,
}: {
  stage: ProjectStage;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(stage.dueDate?.slice(0, 10) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.patch(`/stages/${stage.id}/due-date`, {
        // Midday UTC keeps the chosen calendar day in every time zone.
        dueDate: value ? `${value}T12:00:00.000Z` : null,
      });
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={(event) => void onSubmit(event)}
    >
      <Field
        label="Due date"
        htmlFor={`due-${stage.id}`}
        hint="Leave empty to clear it. The other party is notified."
      >
        <Input
          id={`due-${stage.id}`}
          type="date"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Button type="submit" size="sm" disabled={busy}>
        Save date
      </Button>
      {error ? <ErrorNotice message={error} /> : null}
    </form>
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

  const load = useCallback(
    () =>
      api.get<{ items: Deliverable[] }>(`/stages/${stageId}/deliverables`).then(
        (data) => setItems(data.items),
        (cause: unknown) => setError(errorMessage(cause)),
      ),
    [stageId],
  );

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

function StageTasks({
  stageId,
  canEdit,
}: {
  stageId: string;
  canEdit: boolean;
}) {
  const [items, setItems] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get<{ items: Task[] }>(`/stages/${stageId}/tasks`).then(
        (data) => {
          setError(null);
          setItems(data.items);
        },
        (cause: unknown) => setError(errorMessage(cause)),
      ),
    [stageId],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
    const setDone = (value: boolean) =>
      setItems((current) =>
        current
          ? current.map((task) =>
              task.id === taskId ? { ...task, isDone: value } : task,
            )
          : current,
      );
    setError(null);
    setDone(isDone);
    try {
      await api.patch(`/tasks/${taskId}`, { isDone });
    } catch (cause) {
      setDone(!isDone);
      setError(errorMessage(cause));
    }
  }

  const done = items?.filter((task) => task.isDone).length ?? 0;

  return (
    <div className="mt-6 border-t border-hairline pt-6">
      <p className="label text-muted">
        Tasks
        {items && items.length > 0 ? ` · ${done}/${items.length} done` : ''}
      </p>

      {error ? (
        <div className="mt-3 flex flex-col items-start gap-3">
          <ErrorNotice message={error} />
          {items === null ? (
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {items === null && !error ? <Skeleton className="mt-3 h-12" /> : null}

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
                  disabled={!canEdit}
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
