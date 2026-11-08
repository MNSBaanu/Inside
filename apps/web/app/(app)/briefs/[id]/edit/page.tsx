'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { TagInput } from '@/components/ui/tag-input';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import type { Brief } from '@/lib/types';

export default function EditBriefPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error, loading } = useApi<{ brief: Brief }>(
    `/briefs/${params.id}`,
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error || !data) {
    return <ErrorNotice message={error ?? 'Brief not found'} />;
  }

  return <BriefForm key={data.brief.id} brief={data.brief} />;
}

function BriefForm({ brief }: { brief: Brief }) {
  const router = useRouter();
  const [styles, setStyles] = useState(brief.styles);
  const [rooms, setRooms] = useState(brief.rooms);
  const [budgetRange, setBudgetRange] = useState(brief.budgetRange ?? '');
  const [description, setDescription] = useState(brief.description ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveError(null);

    if (rooms.length === 0) {
      setSaveError('Keep at least one room on the brief.');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/briefs/${brief.id}`, {
        styles,
        rooms,
        budgetRange: budgetRange || undefined,
        description: description || undefined,
      });
      router.push(`/briefs/${brief.id}`);
    } catch (cause) {
      setSaveError(errorMessage(cause));
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        variant="app"
        eyebrow="Edit brief"
        title="Update your brief."
      />

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
              onClick={() => router.push(`/briefs/${brief.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
