'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { TagInput } from '@/components/ui/tag-input';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Brief } from '@/lib/types';

export default function EditBriefPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, error, loading } = useApi<{ brief: Brief }>(
    `/briefs/${params.id}`,
  );

  const [styles, setStyles] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState('');
  const [description, setDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fill the form once the brief loads.
  const [formData, setFormData] = useState<typeof data>(null);
  if (data && data !== formData) {
    setFormData(data);
    setStyles(data.brief.styles);
    setRooms(data.brief.rooms);
    setBudgetRange(data.brief.budgetRange ?? '');
    setDescription(data.brief.description ?? '');
  }

  if (loading) return <Skeleton className="h-64" />;
  if (error || !data) {
    return <ErrorNotice message={error ?? 'Brief not found'} />;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);

    if (rooms.length === 0) {
      setSaveError('Keep at least one room on the brief.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/briefs/${params.id}`, {
        styles,
        rooms,
        budgetRange: budgetRange || undefined,
        description: description || undefined,
      });
      router.push(`/briefs/${params.id}`);
    } catch (cause) {
      setSaveError(errorMessage(cause));
      setSaving(false);
    }
  }

  return (
    <div>
      <Badge tone="brand">Edit brief</Badge>
      <h1 className="mt-6 font-display text-section font-semibold">
        Update your brief.
      </h1>

      <Card className="mt-12">
        <CardHeader title="Brief details" />

        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          {saveError ? <ErrorNotice message={saveError} /> : null}

          <Field label="Rooms" htmlFor="rooms" hint="Press Enter to add.">
            <TagInput id="rooms" values={rooms} onChange={setRooms} />
          </Field>

          <Field label="Styles" htmlFor="styles">
            <TagInput id="styles" values={styles} onChange={setStyles} />
          </Field>

          <Field label="Budget range" htmlFor="budgetRange">
            <Input
              id="budgetRange"
              maxLength={80}
              value={budgetRange}
              onChange={(event) => setBudgetRange(event.target.value)}
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              maxLength={4000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-4">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push(`/briefs/${params.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
