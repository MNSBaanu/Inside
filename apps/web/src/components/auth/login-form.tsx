'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError, loginRequest, redirectPathAfterAuth } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const DEMO_PASSWORD = 'Password123!';

const DEMO_ACCOUNTS = [
  { label: 'Client', email: 'client@inside.test' },
  { label: 'Designer', email: 'designer@inside.test' },
  { label: 'Admin', email: 'admin@inside.test' },
] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || password.length < 8) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }

    setPending(true);
    try {
      const data = await loginRequest(email.trim(), password);
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') ? next : redirectPathAfterAuth(data.user));
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Demo accounts</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => fillDemo(account.email)}
            >
              {account.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Fills email + password ({DEMO_PASSWORD}). Then click Sign in.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@inside.test"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}>
          Register
        </Link>
      </p>
    </form>
  );
}
