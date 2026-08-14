'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { formatApiError, verifyEmailRequest } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || token.length < 20) {
      setStatus('error');
      setError('Missing or invalid verification token.');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('working');
      try {
        await verifyEmailRequest(token);
        if (!cancelled) setStatus('ok');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(formatApiError(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-4">
      {status === 'working' || status === 'idle' ? (
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      ) : null}
      {status === 'ok' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Email verified. You can log in now.
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Link
        href="/login"
        className={cn(buttonVariants({ size: 'sm' }))}
      >
        Go to log in
      </Link>
    </div>
  );
}
