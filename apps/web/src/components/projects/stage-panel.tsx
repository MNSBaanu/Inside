'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineAlert } from '@/components/layout/inline-alert';
import { Skeleton } from '@/components/layout/skeleton';
import { StatusPill } from '@/components/layout/status-pill';
import { formatApiError } from '@/lib/api/auth';
import {
  addDeliverable,
  listDeliverables,
  setDeliverableFeedback,
} from '@/lib/api/deliverables';
import {
  approveStage,
  rejectStage,
  setStageDueDate,
  startStage,
  submitStage,
} from '@/lib/api/stages';
import { payPayment, releasePayment } from '@/lib/api/payments';
import type {
  Deliverable,
  MilestonePayment,
  ProjectStage,
} from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';

type Role = 'client' | 'designer' | 'viewer';

export function StagePanel({
  stage,
  role,
  canAct,
  isCurrent,
  projectActive,
  payment,
  onChanged,
}: {
  stage: ProjectStage;
  role: Role;
  canAct: boolean;
  isCurrent: boolean;
  projectActive: boolean;
  payment: MilestonePayment | null;
  onChanged: () => Promise<void>;
}) {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [dueDateDraft, setDueDateDraft] = useState(
    stage.dueDate ? stage.dueDate.slice(0, 10) : '',
  );
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {},
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDeliverables(stage.id);
      setItems(data.items);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [stage.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDueDateDraft(stage.dueDate ? stage.dueDate.slice(0, 10) : '');
  }, [stage.dueDate]);

  const openForWork = stage.status === 'IN_PROGRESS' || stage.status === 'REJECTED';
  const canEditDueDate = canAct && (role === 'client' || role === 'designer');
  const designerCanStart =
    role === 'designer' && canAct && stage.status === 'PENDING' && isCurrent;
  const designerCanWork = role === 'designer' && canAct && openForWork;
  const clientCanDecide =
    role === 'client' && canAct && stage.status === 'SUBMITTED';

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await addDeliverable(stage.id, {
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setFileUrl('');
      setFileName('');
      setNotes('');
    });
  }

  return (
    <section className="surface-panel space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl tracking-tight">
            {STAGE_LABELS[stage.name]}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <StatusPill value={stage.status} />
            <span className="tabular-nums">{formatLkr(stage.fee)}</span>
            {stage.submittedAt ? (
              <span>
                Submitted {new Date(stage.submittedAt).toLocaleDateString()}
              </span>
            ) : null}
            {stage.approvedAt ? (
              <span>
                Approved {new Date(stage.approvedAt).toLocaleDateString()}
              </span>
            ) : null}
            {payment ? (
              <span className="flex items-center gap-1.5">
                Milestone <StatusPill value={payment.status} />
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {designerCanStart ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => run(() => startStage(stage.id))}
            >
              Start stage
            </Button>
          ) : null}
          {designerCanWork ? (
            <Button
              type="button"
              size="sm"
              disabled={busy || items.length === 0}
              onClick={() => run(() => submitStage(stage.id))}
            >
              Submit for approval
            </Button>
          ) : null}
          {clientCanDecide ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => run(() => approveStage(stage.id))}
            >
              Approve
            </Button>
          ) : null}
          {role === 'client' && payment?.status === 'PENDING' ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => run(() => payPayment(payment.id))}
            >
              Pay {formatLkr(payment.amount)}
            </Button>
          ) : null}
          {role === 'client' && payment?.status === 'PAID' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => run(() => releasePayment(payment.id))}
            >
              Release to designer
            </Button>
          ) : null}
        </div>
      </header>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="stage-due-date">
            <CalendarClock aria-hidden="true" className="size-3.5" />
            Due date
          </Label>
          <Input
            id="stage-due-date"
            type="date"
            value={dueDateDraft}
            disabled={!canEditDueDate || busy}
            onChange={(e) => setDueDateDraft(e.target.value)}
          />
        </div>
        {canEditDueDate ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || !dueDateDraft}
              onClick={() =>
                run(async () => {
                  await setStageDueDate(
                    stage.id,
                    new Date(`${dueDateDraft}T12:00:00`).toISOString(),
                  );
                })
              }
            >
              Save due date
            </Button>
            {stage.dueDate ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await setStageDueDate(stage.id, null);
                    setDueDateDraft('');
                  })
                }
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!projectActive ? (
        <InlineAlert tone="info">
          Stage actions are paused while the project is not active.
        </InlineAlert>
      ) : null}

      {designerCanWork && items.length === 0 ? (
        <InlineAlert tone="info">
          Upload at least one deliverable before submitting.
        </InlineAlert>
      ) : null}

      {clientCanDecide ? (
        <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="reject-reason">Rejection reason (optional)</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ask for a different palette, layout, or detail"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await rejectStage(stage.id, reason.trim() || undefined);
                setReason('');
              })
            }
          >
            Request changes
          </Button>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-border/60 pt-5">
        <h3 className="flex items-center gap-2 font-heading text-lg tracking-tight">
          <FileText aria-hidden="true" className="size-4 text-primary" />
          Deliverables ({items.length})
        </h3>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing uploaded for this stage yet.
          </p>
        ) : null}

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="space-y-2 rounded-xl border border-border/60 bg-muted/25 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Version {item.version} ·{' '}
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {item.fileName ?? 'Open file'}
                  </a>
                </div>
              </div>
              {item.notes ? (
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              ) : null}
              {item.feedback ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Client feedback: </span>
                  {item.feedback}
                </p>
              ) : null}

              {role === 'client' && canAct ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={feedbackDrafts[item.id] ?? ''}
                    onChange={(e) =>
                      setFeedbackDrafts((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    placeholder="Leave feedback on this version"
                    aria-label={`Feedback for version ${item.version}`}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || !(feedbackDrafts[item.id] ?? '').trim()}
                    onClick={() =>
                      run(async () => {
                        await setDeliverableFeedback(
                          item.id,
                          (feedbackDrafts[item.id] ?? '').trim(),
                        );
                        setFeedbackDrafts((prev) => ({
                          ...prev,
                          [item.id]: '',
                        }));
                      })
                    }
                  >
                    Save
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        {designerCanWork ? (
          <form
            onSubmit={onUpload}
            className="space-y-4 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4"
          >
            <div className="space-y-2">
              <Label htmlFor="fileUrl">File link</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://cdn.example.com/concept-boards.pdf"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fileName">File name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Concept boards v1.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliverableNotes">Notes</Label>
                <Textarea
                  id="deliverableNotes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Two palette options for the living room"
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Uploading…' : 'Add deliverable'}
            </Button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
