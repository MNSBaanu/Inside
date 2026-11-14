'use client';

import { cn } from '@/lib/utils/cn';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, cardSurface } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';
import { useApi } from '@/lib/api/use-api';
import type { VerificationStatus } from '@/lib/types';
import { FileUpload } from '@/components/ui/file-upload';

type Verification = {
  id: string;
  evidenceUrl: string;
  notes: string | null;
  reviewNotes: string | null;
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
        <PageHeader
          variant="app"
          eyebrow="Verification"
          title="For designers."
        />
        <div className="mt-6">
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
      <PageHeader
        variant="app"
        eyebrow="Verification"
        title="Get the verified badge."
        description="Submit proof of qualification or past work. An admin reviews every submission before the badge appears on your profile."
      />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader
            title="Submit evidence"
            description="A link to a certificate, registration record or documented project."
          />

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
              <FileUpload
                folder="attachments"
                accept="image/*,.pdf"
                label="Or upload a document"
                onUploaded={(file) => setEvidenceUrl(file.url)}
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
              <Button type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit for review'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="How it works" />
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-semibold">What to submit</dt>
              <dd className="mt-1 text-muted">
                Any one of: a design degree or diploma certificate, membership
                of a professional body such as SLIA, a business registration,
                or photos and an invoice from a project you completed.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">What you get</dt>
              <dd className="mt-1 text-muted">
                A Verified badge on your profile and cards, a higher place in
                the designer directory and in the designers suggested to
                clients.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Review</dt>
              <dd className="mt-1 text-muted">
                An admin checks every submission. You can have one submission
                under review at a time, and you get a notification when it is
                decided.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">If it is rejected</dt>
              <dd className="mt-1 text-muted">
                The admin&apos;s feedback appears under Your submissions. Fix
                what they mention and submit again.
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Your submissions
          {data ? (
            <span className="ml-2 text-sm font-normal text-muted">
              {data.items.length}
            </span>
          ) : null}
        </h2>

        <div className="mt-3">
          {error ? <ErrorNotice message={error} /> : null}

          {loading ? (
            <Skeleton className="h-16" />
          ) : data && data.items.length > 0 ? (
            <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
              {data.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <a
                        href={safeHref(item.evidenceUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:text-brand"
                      >
                        Evidence
                      </a>
                      <span className="text-xs text-muted">
                        Submitted {formatDate(item.createdAt)}
                      </span>
                    </div>
                    {item.notes ? (
                      <p className="mt-0.5 truncate text-sm text-muted">{item.notes}</p>
                    ) : null}
                    {item.reviewNotes ? (
                      <p className="mt-0.5 break-words text-sm">
                        Admin feedback: {item.reviewNotes}
                      </p>
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
