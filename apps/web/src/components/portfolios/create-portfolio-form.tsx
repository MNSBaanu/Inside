'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import { createPortfolio } from '@/lib/api/portfolios';

export function CreatePortfolioForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [budget, setBudget] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://picsum.photos/seed/inside-new/1200/800',
  );
  const [isPublished, setIsPublished] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 2 || style.trim().length < 2 || roomType.trim().length < 2) {
      setError('Title, style, and room type are required.');
      return;
    }
    setPending(true);
    try {
      const data = await createPortfolio({
        title: title.trim(),
        description: description.trim() || undefined,
        style: style.trim(),
        roomType: roomType.trim(),
        budget: budget ? Number(budget) : undefined,
        isPublished,
        images: imageUrl.trim()
          ? [{ imageUrl: imageUrl.trim() }]
          : undefined,
      });
      router.replace(`/designer/portfolios/${data.portfolio.id}`);
      router.refresh();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-lg flex-col gap-5">
      <div className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Designer · New
        </p>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          New portfolio
        </h1>
        <p className="text-sm text-muted-foreground">
          Image upload uses a URL for now (Cloudinary later).
        </p>
      </div>
      <div className="surface-panel space-y-4 p-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
        <Input id="style" value={style} onChange={(e) => setStyle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roomType">Room type</Label>
        <Input
          id="roomType"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Budget (optional)</Label>
        <Input
          id="budget"
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Cover image URL</Label>
        <Input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Publish immediately
      </label>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create portfolio'}
      </Button>
      </div>
    </form>
  );
}
