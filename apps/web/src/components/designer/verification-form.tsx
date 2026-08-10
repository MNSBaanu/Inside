'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminBadge } from '@/components/admin/admin-badge';
import { PageHeader } from '@/components/layout/page-header';
import { formatApiError } from '@/lib/api/auth';
import {
  listMyVerifications,
  submitVerification,
} from '@/lib/api/verifications';
import type { Verification } from '@/lib/api/types';

export function VerificationForm() {
  const [items, setItems] = useState<Verification[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMyVerifications();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasPending = items.some((item) => item.status === 'PENDING');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await submitVerification({
        evidenceUrl: evidenceUrl.trim(),
        notes: notes.trim() || undefined,
      });
      setItems((prev) => [data.verification, ...prev]);
      setEvidenceUrl('');
      setNotes('');
      setMessage('Submitted — an admin will review it shortly.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Designer · Trust"
        title="Get verified"
        description="Share a link to your credentials so admins can add a verified badge to your profile."
      />

      <form onSubmit={onSubmit} className="surface-panel max-w-2xl space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="evidenceUrl">Evidence link</Label>
          <Input
            id="evidenceUrl"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://drive.example.com/portfolio-licence.pdf"
            required
            minLength={4}
          />
          <p className="text-xs text-muted-foreground">
            A licence, certificate, or business registration document.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Note for the reviewer (optional)</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registered interior designer since 2019"
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={saving || hasPending}>
          {saving
            ? 'Submitting…'
            : hasPending
              ? 'Review in progress'
              : 'Submit for review'}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">History</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have not submitted a verification request yet.
          </p>
        ) : null}
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="surface-panel flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AdminBadge value={item.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {item.notes ? (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                ) : null}
              </div>
              <a
                href={item.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Evidence
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
