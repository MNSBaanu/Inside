'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Field, Input, Textarea } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { ROOM_TYPES, STYLES } from '@/lib/options';
import { useApi } from '@/lib/use-api';
import type { Portfolio } from '@/lib/types';
import { isOptimizableImage } from '@/lib/images';

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
  const [removingId, setRemovingId] = useState<string | null>(null);

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
      <Badge tone="brand">My work</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Your published projects.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Published work is what clients browse, and what the matching engine
        reads when ranking you against a brief.
      </p>

      <Card className="mt-12">
        <CardHeader
          title="Add a project"
          description="Publish a finished room with at least one image."
        />

        <form onSubmit={onCreate} className="flex flex-col gap-6">
          {formError ? <ErrorNotice message={formError} /> : null}

          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Kalutara Villa"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
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

          <div>
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Publishing…' : 'Publish project'}
            </Button>
          </div>
        </form>
      </Card>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">Published work</h2>

        <div className="mt-8">
          {error ? <ErrorNotice message={error} /> : null}

          {loading ? (
            <div className="grid gap-8 sm:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : data && data.items.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2">
              {data.items.map((portfolio) => (
                <li
                  key={portfolio.id}
                  className="overflow-hidden rounded-card border border-hairline bg-surface"
                >
                  <div className="relative aspect-[4/3] bg-sand">
                    {portfolio.images[0] ? (
                      <Image
                        src={portfolio.images[0].imageUrl}
                        unoptimized={!isOptimizableImage(portfolio.images[0].imageUrl)}
                        alt={portfolio.title}
                        fill
                        sizes="(min-width: 640px) 45vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center ui-label text-muted">
                        No images
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl font-semibold">
                          {portfolio.title}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatMoney(portfolio.budget)}
                        </p>
                      </div>
                      <Badge tone={portfolio.isPublished ? 'support' : 'neutral'}>
                        {portfolio.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/portfolios/${portfolio.id}`}
                        className="ui-label link-underline text-ink"
                      >
                        View
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={removingId === portfolio.id}
                        onClick={() => onDelete(portfolio.id)}
                      >
                        {removingId === portfolio.id ? 'Removing…' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : !error ? (
            <EmptyState
              title="Nothing published yet."
              description="Add your first project so clients can find you."
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
