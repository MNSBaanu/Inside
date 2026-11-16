'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/components/ui/toast';

const roles = ['CLIENT', 'DESIGNER'] as const;

export function RoleSwitch() {
  const { user, refreshUser } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();

  if (!user || user.role === 'ADMIN') return null;

  async function run(action: () => Promise<unknown>, done: string, next?: string) {
    setError(null);
    setBusy(true);
    try {
      await action();
      await refreshUser();
      toast(done);
      if (next) router.push(next);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (user.role === 'CLIENT') {
    return (
      <Card>
        <CardHeader
          title="Designer account"
          description="Take on interior projects yourself. You keep your client account and can switch between the two."
        />
        {error ? <ErrorNotice message={error} /> : null}
        <Button variant="outline" disabled={busy} onClick={() => setConfirming(true)}>
          Create designer account
        </Button>
        {confirming ? (
          <ConfirmDialog
            title="Create a designer account?"
            description="Your profile will be listed as a designer. Submit your qualifications for verification to get the verified badge."
            confirmLabel="Create designer account"
            busy={busy}
            onConfirm={() =>
              run(
                () => api.post('/users/me/designer-account', {}),
                'Designer account created.',
                '/verification',
              )
            }
            onCancel={() => setConfirming(false)}
          />
        ) : null}
      </Card>
    );
  }

  if (!user.hasClientAccount) {
    return (
      <Card>
        <CardHeader
          title="Client account"
          description="Brief your own projects and hire other designers. You keep your designer account and can switch between the two."
        />
        {error ? <ErrorNotice message={error} /> : null}
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(() => api.post('/users/me/client-account', {}), 'Client account created.')
          }
        >
          Create client account
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Working as"
        description="Switch between hiring a designer and taking on work yourself."
      />

      {error ? <ErrorNotice message={error} /> : null}

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => api.patch('/users/me/active-role', { activeRole: role }),
                `Now working as a ${role === 'CLIENT' ? 'client' : 'designer'}.`,
              )
            }
            aria-pressed={user.activeRole === role}
            className={cn(
              'rounded-card border p-5 text-left transition-colors duration-300 disabled:opacity-60',
              user.activeRole === role
                ? 'border-brand bg-brand-soft'
                : 'border-hairline bg-surface hover:border-ink/30',
            )}
          >
            <span className="block font-display text-lg font-semibold">
              {role === 'CLIENT' ? 'Client' : 'Designer'}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {role === 'CLIENT'
                ? 'Brief projects and hire designers.'
                : 'Publish work and send proposals.'}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
