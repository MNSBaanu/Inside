'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import type { User } from '@/lib/types';

export default function AccountPage() {
  const { user, refreshUser, logout } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    avatarUrl: '',
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      bio: user.bio ?? '',
      phone: user.phone ?? '',
      location: user.location ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setIsAvailable(user.isAvailable);
  }, [user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.patch<{ user: User }>('/users/me', {
        name: form.name,
        bio: form.bio || undefined,
        phone: form.phone || undefined,
        location: form.location || undefined,
        avatarUrl: form.avatarUrl || undefined,
        isAvailable,
      });
      await refreshUser();
      setSaved(true);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    await logout();
    router.push('/');
  }

  const isDesigner = user?.role === 'DESIGNER';

  return (
    <div>
      <Badge tone="brand">Account</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Your profile.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        This is what clients and designers see when they come across you on
        Inside.
      </p>

      <Card className="mt-12">
        <CardHeader
          title="Profile details"
          description="Keep this current — it feeds your public profile."
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          {error ? <ErrorNotice message={error} /> : null}
          {saved ? (
            <p className="rounded-card bg-support-soft px-4 py-3 text-sm text-success">
              Profile updated.
            </p>
          ) : null}

          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              required
              minLength={2}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </Field>

          <Field label="Bio" htmlFor="bio" hint="Up to 1000 characters.">
            <Textarea
              id="bio"
              maxLength={1000}
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              placeholder="How you work, what you specialise in."
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                value={form.location}
                onChange={(event) =>
                  setForm({ ...form, location: event.target.value })
                }
                placeholder="Colombo"
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="+94 7X XXX XXXX"
              />
            </Field>
          </div>

          <Field
            label="Avatar URL"
            htmlFor="avatarUrl"
            hint="Paste a link to an image until uploads are available."
          >
            <Input
              id="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={(event) =>
                setForm({ ...form, avatarUrl: event.target.value })
              }
              placeholder="https://…"
            />
          </Field>

          {isDesigner ? (
            <label className="flex items-center gap-3 rounded-card bg-sand px-5 py-4">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(event) => setIsAvailable(event.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm">
                I am available to take on new projects
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-4">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onSignOut}
            >
              Sign out
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
