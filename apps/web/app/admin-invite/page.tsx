'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthLayout } from '@/components/features/auth/auth-layout';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';

function AcceptInvite() {
  const token = useSearchParams().get('token');
  const { user, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      await api.post('/admin/invites/accept', { token });
      window.location.assign('/admin');
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  if (!token) {
    return <ErrorNotice message="This invite link is incomplete. Open the link from your email again." />;
  }
  if (status === 'loading') return <Skeleton className="h-24 w-full" />;

  if (status === 'unauthenticated' || !user) {
    const next = `/admin-invite?token=${encodeURIComponent(token)}`;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Sign in or create an account with the email address the invite was sent to. If you create an account, open the link in your email again afterwards.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            <Button>Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Signed in as <span className="font-medium text-ink">{user.email}</span>.
      </p>
      {error ? <ErrorNotice message={error} /> : null}
      <div>
        <Button onClick={() => void accept()} disabled={busy}>
          {busy ? 'Accepting…' : 'Accept admin invite'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminInvitePage() {
  return (
    <AuthLayout
      eyebrow="Admin invite"
      title="Join the Inside admin team."
      description="The platform owner invited you to help run Inside."
      footer={<Link href="/" className="link-underline font-semibold text-ink">Back to Inside</Link>}
    >
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <AcceptInvite />
      </Suspense>
    </AuthLayout>
  );
}
