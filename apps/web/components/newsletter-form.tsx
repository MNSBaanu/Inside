'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { api, errorMessage } from '@/lib/api';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.post('/newsletter/subscribe', { email }, { auth: false });
      setDone(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="mt-8 text-sm text-ink">
        Thanks, you&apos;re on the list for Inside updates.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8">
      <label htmlFor="newsletter-email" className="label">
        Get updates
      </label>
      <div className="mt-3 flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 text-sm"
        />
        <Button type="submit" disabled={sending} className="shrink-0">
          {sending ? 'Sending…' : 'Subscribe'}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
      <p className="mt-2 text-xs text-muted">
        Occasional news about Inside. No spam.
      </p>
    </form>
  );
}
