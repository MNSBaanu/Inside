'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthUser } from '@/lib/api/types';
import {
  fetchMe,
  formatApiError,
  redirectPathAfterAuth,
  switchActiveRoleRequest,
  updateProfileRequest,
} from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function ProfileForm() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
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
        ...(user?.role === 'DESIGNER' ? { isAvailable } : {}),
      });
      setUser(updated);
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
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error ?? 'Could not load profile.'}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Account
        </p>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          {user.email} · {user.role}
          {user.role === 'DESIGNER' ? ` · mode ${user.activeRole}` : ''}
        </p>
      </div>

      <form onSubmit={onSave} className="surface-panel flex flex-col gap-4 p-5">
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
          <Label htmlFor="bio">Bio</Label>
          <Input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short intro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        {user.role === 'DESIGNER' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Available for new projects
          </label>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-primary" role="status">
            {message}
          </p>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      {user.role === 'DESIGNER' ? (
        <div className="surface-panel p-5">
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

      <div className="surface-panel space-y-2 p-5">
        <h2 className="font-heading text-xl tracking-tight">Trust &amp; safety</h2>
        <p className="text-sm text-muted-foreground">
          Manage blocked users and reports you have filed.
        </p>
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
