'use client';

import { cn } from '@/lib/utils/cn';
import { ImageOff } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, cardSurface } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input, Textarea } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { formatMoney } from '@/lib/utils/format';
import { ROOM_TYPES, STYLES } from '@/lib/utils/options';
import { useApi } from '@/lib/api/use-api';
import type { Portfolio } from '@/lib/types';
import { isOptimizableImage } from '@/lib/utils/images';

export default function ManagePortfoliosPage() {
  const { data, error, loading, reload } =
    useApi<{ items: Portfolio[] }>('/portfolios/mine');

  const [form, setForm] = useState({
    title: '',
    description: '',
    style: '',
    roomType: '',
    budget: '',
    imageUrl: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await api.post('/portfolios', {
        title: form.title,
        description: form.description || undefined,
        style: form.style || undefined,
        roomType: form.roomType || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        isPublished: true,
        images: form.imageUrl
          ? [{ imageUrl: form.imageUrl, displayOrder: 0 }]
          : undefined,
      });
      setForm({
        title: '',
        description: '',
        style: '',
        roomType: '',
        budget: '',
        imageUrl: '',
      });
      setAdding(false);
      await reload();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setFormError(null);
    setRemovingId(id);
    try {
      await api.delete(`/portfolios/${id}`);
      await reload();
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="My work"
        title="Your published projects."
        description="Published work is what clients browse, and what helps match you with their briefs."
        action={
          <Button size="lg" onClick={() => setAdding(!adding)}>
            {adding ? 'Close' : 'Add project'}
          </Button>
        }
      />

      {adding ? (
        <Card className="mt-6">
          <CardHeader
            title="Add a project"
            description="Publish a finished room with at least one image."
          />

          <form onSubmit={onCreate} className="flex flex-col gap-5">
            {formError ? <ErrorNotice message={formError} /> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" htmlFor="title">
                <Input
                  id="title"
                  required
                  minLength={2}
                  maxLength={160}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Kalutara Villa"
                />
              </Field>
              <Field label="Budget" htmlFor="budget" hint="Optional, in LKR.">
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={(event) =>
                    setForm({ ...form, budget: event.target.value })
                  }
                  placeholder="650000"
                />
              </Field>
              <Field label="Style" htmlFor="style">
                <Combobox
                  id="style"
                  value={form.style}
                  options={STYLES}
                  onChange={(style) => setForm({ ...form, style })}
                  placeholder="Tropical Modern"
                />
              </Field>
              <Field label="Room type" htmlFor="roomType">
                <Combobox
                  id="roomType"
                  value={form.roomType}
                  options={ROOM_TYPES}
                  onChange={(roomType) => setForm({ ...form, roomType })}
                  placeholder="Living Room"
                />
              </Field>
            </div>

            <FileUpload
              folder="portfolios"
              label="Cover image"
              onUploaded={(file) => setForm({ ...form, imageUrl: file.url })}
            />

            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="What the brief was, and how you solved it."
              />
            </Field>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Publishing…' : 'Publish project'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <section className="mt-8">
        {error ? <ErrorNotice message={error} /> : null}
        {!adding && formError ? <ErrorNotice message={formError} /> : null}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : data && data.items.length > 0 ? (
          <ul className={cn(cardSurface, 'divide-y divide-hairline overflow-hidden')}>
            {data.items.map((portfolio) => (
              <li key={portfolio.id} className="flex items-center gap-4 px-5 py-3">
                <Link
                  href={`/portfolios/${portfolio.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-4"
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {portfolio.images[0] ? (
                      <Image
                        src={portfolio.images[0].imageUrl}
                        unoptimized={!isOptimizableImage(portfolio.images[0].imageUrl)}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <ImageOff
                        aria-hidden
                        className="absolute inset-0 m-auto h-4 w-4 text-muted"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold group-hover:text-brand">
                      {portfolio.title}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {[
                        portfolio.style,
                        portfolio.roomType,
                        portfolio.budget !== null ? formatMoney(portfolio.budget) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'No details'}
                    </span>
                  </span>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={portfolio.isPublished ? 'support' : 'neutral'}>
                    {portfolio.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <IconButton
                    action="delete"
                    label={`Delete ${portfolio.title}`}
                    disabled={removingId === portfolio.id}
                    onClick={() => setConfirmId(portfolio.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <EmptyState
            title="Nothing published yet."
            description="Add your first project so clients can find you."
            action={<Button onClick={() => setAdding(true)}>Add project</Button>}
          />
        ) : null}
      </section>

      {confirmId ? (
        <ConfirmDialog
          title="Delete this project?"
          description="It will be removed from your profile and the explore page. This cannot be undone."
          onCancel={() => setConfirmId(null)}
          onConfirm={() => {
            const id = confirmId;
            setConfirmId(null);
            void onDelete(id);
          }}
        />
      ) : null}
    </div>
  );
}
