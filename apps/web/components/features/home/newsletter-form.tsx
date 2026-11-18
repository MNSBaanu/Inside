'use client';

import { Check, Mail } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/api/client';

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
      <p role="status" className="flex items-center gap-2 text-sm text-canvas">
        <Check aria-hidden className="h-4 w-4 text-brand-soft" />
        Thanks, you&apos;re on the list for Inside updates.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <label
        htmlFor="newsletter-email"
        className="text-sm font-semibold uppercase tracking-wider text-canvas"
      >
        A little inspiration in your inbox
      </label>
      <p className="mt-2 text-sm leading-relaxed text-canvas/70">
        Occasional news about Inside. No spam.
      </p>
      <div className="mt-4 flex items-center gap-1 rounded-full border border-canvas/25 bg-canvas/5 p-1 transition-colors focus-within:border-brand-soft">
        <Mail aria-hidden className="ml-3 h-4 w-4 shrink-0 text-canvas/60" />
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-canvas placeholder:text-canvas/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-full bg-canvas px-4 py-2 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
