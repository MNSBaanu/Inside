'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import {
  addPortfolioImage,
  getPortfolio,
  removePortfolioImage,
  updatePortfolio,
} from '@/lib/api/portfolios';
import type { Portfolio } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function ManagePortfolioForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [budget, setBudget] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPortfolio(params.id);
        if (cancelled) return;
        const p = data.portfolio;
        setPortfolio(p);
        setTitle(p.title);
        setDescription(p.description ?? '');
        setStyle(p.style);
        setRoomType(p.roomType);
        setBudget(p.budget != null ? String(p.budget) : '');
        setIsPublished(p.isPublished);
      } catch (err) {
        if (!cancelled) setError(formatApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!portfolio) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await updatePortfolio(portfolio.id, {
        title: title.trim(),
        description: description.trim(),
        style: style.trim(),
        roomType: roomType.trim(),
        budget: budget ? Number(budget) : undefined,
        isPublished,
      });
      setPortfolio(data.portfolio);
      setMessage('Saved.');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onAddImage(event: React.FormEvent) {
    event.preventDefault();
    if (!portfolio || !imageUrl.trim()) return;
    setError(null);
    try {
      await addPortfolioImage(portfolio.id, { imageUrl: imageUrl.trim() });
      const data = await getPortfolio(portfolio.id);
      setPortfolio(data.portfolio);
      setImageUrl('');
      setMessage('Image added.');
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function onRemoveImage(imageId: string) {
    if (!portfolio) return;
    setError(null);
    try {
      await removePortfolioImage(portfolio.id, imageId);
      setPortfolio((prev) =>
        prev
          ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) }
          : prev,
      );
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!portfolio) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error ?? 'Portfolio not found.'}
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl tracking-tight">Manage portfolio</h1>
        <Link
          href={`/portfolios/${portfolio.id}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Public view
        </Link>
      </div>

      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="style">Style</Label>
          <Input id="style" value={style} onChange={(e) => setStyle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomType">Room type</Label>
          <Input
            id="roomType"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Published
        </label>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-lg font-medium">Images</h2>
        <form onSubmit={onAddImage} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <Button type="submit">Add image</Button>
        </form>
        <ul className="grid gap-3 sm:grid-cols-2">
          {portfolio.images.map((image) => (
            <li key={image.id} className="overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.caption ?? 'Portfolio'}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveImage(image.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

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

      <Button type="button" variant="ghost" onClick={() => router.push('/designer')}>
        Back to list
      </Button>
    </div>
  );
}
