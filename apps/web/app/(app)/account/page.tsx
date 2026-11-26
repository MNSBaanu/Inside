'use client';

import { useState } from 'react';
import { useSignOut } from '@/components/layout/app-shell';
import { useSession } from '@/components/providers/session-provider';
import { RoleSwitch } from '@/components/features/account/role-switch';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { LOCATIONS } from '@/lib/utils/options';
import type { User } from '@/lib/types';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/components/ui/toast';

export default function AccountPage() {
  const { user } = useSession();
  if (!user) return <Skeleton className="h-64" />;
  return <AccountForm key={user.id} user={user} />;
}

function AccountForm({ user }: { user: User }) {
  const { refreshUser } = useSession();
  const onSignOut = useSignOut();

  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? '',
    phone: user.phone ?? '',
    location: user.location ?? '',
    avatarUrl: user.avatarUrl ?? '',
  });
  const [isAvailable, setIsAvailable] = useState(user.isAvailable);
  const [availableFrom, setAvailableFrom] = useState(
    user.availableFrom?.slice(0, 10) ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.patch<{ user: User }>('/users/me', {
        name: form.name,
        bio: form.bio || undefined,
        phone: form.phone || undefined,
        location: form.location || undefined,
        avatarUrl: form.avatarUrl || null,
        isAvailable,
        ...(isDesigner ? { availableFrom: availableFrom || null } : {}),
      });
      await refreshUser();
      toast('Profile updated.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const isDesigner = user?.role === 'DESIGNER';

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Account"
        title="Your profile."
        description="This is what clients and designers see when they come across you on Inside."
      />

      {isDesigner ? (
        <p className="mt-4 max-w-xl text-sm text-muted">
          Your profile appears in the designer directory once you publish a
          project or receive verification. Availability controls whether clients
          can send you new direct requests.
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader
          title="Profile details"
          description="Keep this current - it feeds your public profile."
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {error ? <ErrorNotice message={error} /> : null}

          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={form.name || user.name} src={form.avatarUrl} size={72} />
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <FileUpload
                  folder="avatars"
                  label={form.avatarUrl ? 'Change photo' : 'Upload photo'}
                  onUploaded={(file) =>
                    setForm((current) => ({ ...current, avatarUrl: file.url }))
                  }
                />
                {form.avatarUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm({ ...form, avatarUrl: '' })}
                  >
                    Remove photo
                  </Button>
                ) : null}
              </div>
              <p className="text-sm text-muted">
                JPG, PNG or WebP. Saved when you press Save.
              </p>
            </div>
          </div>

          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              required
              minLength={2}
              maxLength={100}
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
              onChange={(event) =>
                setForm({ ...form, bio: event.target.value })
              }
              placeholder="How you work, what you specialise in."
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location" htmlFor="location">
              <Combobox
                id="location"
                value={form.location}
                options={LOCATIONS}
                onChange={(location) => setForm({ ...form, location })}
                placeholder="Colombo"
              />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                placeholder="+94 7X XXX XXXX"
              />
            </Field>
          </div>

          {isDesigner ? (
            <div className="flex flex-col gap-4 rounded-card bg-sand px-5 py-4">
              <label className="flex items-center gap-3">
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
              {isAvailable ? (
                <Field
                  label="Available from"
                  htmlFor="available-from"
                  hint="Leave empty if you can start now. Clients see this date and it affects your match score."
                >
                  <Input
                    id="available-from"
                    type="date"
                    value={availableFrom}
                    onChange={(event) => setAvailableFrom(event.target.value)}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-6">
        <RoleSwitch />
        <Card>
          <CardHeader title="Sign out" description="End your session on this device." />
          <Button type="button" variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </Card>
      </div>
      </div>
    </div>
  );
}
