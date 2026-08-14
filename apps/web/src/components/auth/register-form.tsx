'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InlineAlert } from '@/components/layout/inline-alert';
import {
  formatApiError,
  redirectPathAfterAuth,
  registerRequest,
} from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'DESIGNER'>('CLIENT');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!email.trim() || password.length < 8) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }

    setPending(true);
    try {
      const data = await registerRequest({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      router.replace(redirectPathAfterAuth(data.user));
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">I am joining as</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: 'CLIENT', title: 'Client', copy: 'I have a space to design' },
              {
                value: 'DESIGNER',
                title: 'Designer',
                copy: 'I take on design work',
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors',
                role === option.value
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-border/60 hover:border-primary/25',
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="font-medium">{option.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.copy}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered?{' '}
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'link' }), 'h-auto p-0')}
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
