'use client';

import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { safeHref } from '@/lib/url';
import { useApi } from '@/lib/use-api';
import type { VerificationStatus } from '@/lib/types';

type Verification = {
  id: string;
  evidenceUrl: string;
  notes: string | null;
  status: VerificationStatus;
  createdAt: string;
};

export default function VerificationPage() {
  const { user } = useSession();
  const { data, error, loading, reload } =
    useApi<{ items: Verification[] }>('/verifications/mine');

  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isDesigner = user?.role === 'DESIGNER';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await api.post('/verifications', {
        evidenceUrl,
        notes: notes || undefined,
      });
      setEvidenceUrl('');
      setNotes('');
      await reload();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!isDesigner) {
    return (
      <div>
        <Badge tone="brand">Verification</Badge>
        <h1 className="mt-6 font-display text-section font-semibold">
          For designers.
        </h1>
        <div className="mt-10">
          <EmptyState
            title="Verification is for designer accounts."
            description="Clients do not need to be verified to brief a project."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Badge tone="brand">Verification</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Get the verified badge.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Submit proof of qualification or past work. An admin reviews every
        submission before the badge appears on your profile.
      </p>

      <Card className="mt-12">
        <CardHeader
          title="Submit evidence"
          description="A link to a certificate, registration record or documented project."
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {formError ? <ErrorNotice message={formError} /> : null}

          <Field label="Evidence URL" htmlFor="evidenceUrl">
            <Input
              id="evidenceUrl"
              type="url"
              required
              minLength={4}
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field label="Notes" htmlFor="notes" hint="Optional context.">
            <Textarea
              id="notes"
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What this document shows."
            />
          </Field>

          <div>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit for review'}
            </Button>
          </div>
        </form>
      </Card>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">
          Your submissions
        </h2>

        <div className="mt-8">
          {error ? <ErrorNotice message={error} /> : null}

          {loading ? (
            <Skeleton className="h-32" />
          ) : data && data.items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-6"
                >
                  <div className="min-w-0">
                    <a
                      href={safeHref(item.evidenceUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="link-underline font-semibold"
                    >
                      Evidence
                    </a>
                    <p className="mt-1 text-sm text-muted">
                      Submitted {formatDate(item.createdAt)}
                    </p>
                    {item.notes ? (
                      <p className="mt-2 text-muted">{item.notes}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          ) : !error ? (
            <EmptyState title="Nothing submitted yet." />
          ) : null}
        </div>
      </section>
    </div>
  );
}
