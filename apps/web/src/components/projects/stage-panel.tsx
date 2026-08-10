'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  startStage,
  submitStage,
} from '@/lib/api/stages';
import type { Deliverable, ProjectStage } from '@/lib/api/types';
import { STAGE_LABELS, formatLkr } from '@/lib/stages';

type Role = 'client' | 'designer' | 'viewer';

export function StagePanel({
  stage,
  role,
  canAct,
  isCurrent,
  projectActive,
  onChanged,
}: {
  stage: ProjectStage;
  role: Role;
  canAct: boolean;
  isCurrent: boolean;
  projectActive: boolean;
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

  const openForWork = stage.status === 'IN_PROGRESS' || stage.status === 'REJECTED';
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
        </div>
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!projectActive ? (
        <p className="text-sm text-muted-foreground">
          Stage actions are paused while the project is not active.
        </p>
      ) : null}

      {designerCanWork && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Upload at least one deliverable before submitting.
        </p>
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
        <h3 className="font-heading text-lg tracking-tight">
          Deliverables ({items.length})
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading deliverables…</p>
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
              className="space-y-2 rounded-xl border border-border/60 p-4"
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
            className="space-y-4 rounded-xl border border-border/60 p-4"
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
                <Input
                  id="deliverableNotes"
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
