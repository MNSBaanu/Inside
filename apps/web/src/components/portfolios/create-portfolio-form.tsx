'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUrlField } from '@/components/layout/image-url-field';
import { InlineAlert } from '@/components/layout/inline-alert';
import { TaxonomyField } from '@/components/layout/taxonomy-field';
import { formatApiError } from '@/lib/api/auth';
import { createPortfolio } from '@/lib/api/portfolios';
import { DEMO_LIVING } from '@/lib/media';
import { ROOM_OPTIONS, STYLE_OPTIONS } from '@/lib/taxonomy';

const STYLE_LABELS = STYLE_OPTIONS.map((option) => option.label);
const ROOM_LABELS = ROOM_OPTIONS.map((option) => option.label);

export function CreatePortfolioForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('');
  const [roomType, setRoomType] = useState('');
  const [budget, setBudget] = useState('');
  const [imageUrl, setImageUrl] = useState(DEMO_LIVING);
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
    <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl flex-col gap-5">
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
      <TaxonomyField
        id="style"
        label="Style"
        options={STYLE_LABELS}
        value={style}
        onChange={setStyle}
        placeholder="Japandi"
      />
      <TaxonomyField
        id="roomType"
        label="Room type"
        options={ROOM_LABELS}
        value={roomType}
        onChange={setRoomType}
        placeholder="Balcony"
      />
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
      <ImageUrlField
        id="imageUrl"
        label="Cover image"
        value={imageUrl}
        onChange={setImageUrl}
      />
      <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span>
          <span className="font-medium">Publish immediately</span>
          <span className="block text-muted-foreground">
            Published work appears in client discovery and matching.
          </span>
        </span>
      </label>
      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create portfolio'}
      </Button>
      </div>
    </form>
  );
}
