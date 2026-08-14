'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserRoundCog } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineAlert } from '@/components/layout/inline-alert';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/layout/skeleton';
import { StatusPill } from '@/components/layout/status-pill';
import type { AuthUser } from '@/lib/api/types';
import {
  fetchMe,
  formatApiError,
  redirectPathAfterAuth,
  switchActiveRoleRequest,
  updateProfileRequest,
} from '@/lib/api/auth';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { cn } from '@/lib/utils';

export function ProfileForm() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setName(me.name);
        setBio(me.bio ?? '');
        setPhone(me.phone ?? '');
        setLocation(me.location ?? '');
        setAvatarUrl(me.avatarUrl ?? '');
        setIsAvailable(me.isAvailable);
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

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfileRequest({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        avatarUrl: avatarUrl.trim(),
        ...(user?.role === 'DESIGNER' ? { isAvailable } : {}),
      });
      setUser(updated);
      setAvatarUrl(updated.avatarUrl ?? '');
      setMessage('Profile saved.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onSwitchRole() {
    if (!user || user.role !== 'DESIGNER') return;
    const next = user.activeRole === 'DESIGNER' ? 'CLIENT' : 'DESIGNER';
    setSwitching(true);
    setError(null);
    try {
      const updated = await switchActiveRoleRequest(next);
      setUser(updated);
      router.replace(redirectPathAfterAuth(updated));
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSwitching(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <InlineAlert tone="error">
        {error ?? 'Could not load profile.'}
      </InlineAlert>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="How you appear to clients and designers across Inside."
      />

      <div className="surface-panel flex flex-wrap items-center gap-4 p-5 md:p-6">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-16 rounded-full border border-border/60 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] font-heading text-xl text-primary"
          >
            {user.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 space-y-1.5">
          <p className="font-heading text-2xl tracking-tight">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill value={user.role} />
            {user.role === 'DESIGNER' ? (
              <span className="text-xs text-muted-foreground">
                Mode: {user.activeRole.toLowerCase()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="surface-panel flex flex-col gap-4 p-5 md:p-6"
      >
        <h2 className="font-heading text-xl tracking-tight">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94…"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short intro clients will read first"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Colombo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar image URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        {user.role === 'DESIGNER' ? (
          <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="font-medium">Available for new projects</span>
              <span className="block text-muted-foreground">
                Clients can see availability while browsing.
              </span>
            </span>
          </label>
        ) : null}
        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
        {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}
        <Button type="submit" disabled={saving} className="w-fit">
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      <ChangePasswordForm />

      {user.role === 'DESIGNER' ? (
        <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary"
            >
              <UserRoundCog className="size-4" />
            </span>
            <div>
              <p className="font-heading text-lg tracking-tight">Workspace mode</p>
              <p className="text-sm text-muted-foreground">
                Currently browsing as {user.activeRole.toLowerCase()}.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={switching}
            onClick={onSwitchRole}
          >
            {switching
              ? 'Switching…'
              : `Switch to ${user.activeRole === 'DESIGNER' ? 'client' : 'designer'} mode`}
          </Button>
        </div>
      ) : null}

      <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary"
          >
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="font-heading text-lg tracking-tight">
              Trust &amp; safety
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage blocked users and reports you have filed.
            </p>
          </div>
        </div>
        <Link
          href="/profile/safety"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Open safety settings
        </Link>
      </div>
    </div>
  );
}
