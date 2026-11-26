'use client';

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Hammer,
  MapPin,
  Ruler,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { IconButton } from '@/components/ui/icon-button';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { useSocketEvent } from '@/lib/realtime/socket';
import { cn } from '@/lib/utils/cn';
import { titleCase } from '@/lib/utils/format';
import { safeHref } from '@/lib/utils/url';
import type { WorkLogEntry, WorkLogType } from '@/lib/types';

const TYPES: { value: WorkLogType; label: string; icon: LucideIcon }[] = [
  { value: 'SITE_VISIT', label: 'Site visit', icon: MapPin },
  { value: 'MEASUREMENT', label: 'Measurements', icon: Ruler },
  { value: 'MEETING', label: 'Meeting', icon: Users },
  { value: 'ORDER', label: 'Order placed', icon: ShoppingCart },
  { value: 'DELIVERY', label: 'Delivery', icon: Truck },
  { value: 'INSTALLATION', label: 'Installation', icon: Hammer },
  { value: 'PROGRESS', label: 'Progress update', icon: Camera },
  { value: 'ISSUE', label: 'Issue', icon: AlertTriangle },
];

const typeOf = (value: WorkLogType) =>
  TYPES.find((type) => type.value === value) ?? TYPES[0];

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function localNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function WorkLog({
  projectId,
  currentUserId,
  partnerName,
  active,
}: {
  projectId: string;
  currentUserId: string;
  partnerName: string;
  active: boolean;
}) {
  const log = useApi<{ items: WorkLogEntry[] }>(
    `/projects/${projectId}/work-log`,
  );
  useSocketEvent('notification:new', () => void log.refresh());

  const [type, setType] = useState<WorkLogType>('SITE_VISIT');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [happenedAt, setHappenedAt] = useState(localNow);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post(`/projects/${projectId}/work-log`, {
        type,
        title: title.trim(),
        note: note.trim() || undefined,
        photos,
        happenedAt: new Date(happenedAt).toISOString(),
      });
      setTitle('');
      setNote('');
      setPhotos([]);
      setUploadKey((current) => current + 1);
      setHappenedAt(localNow());
      await log.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function run(id: string, action: () => Promise<unknown>) {
    setError(null);
    setBusyId(id);
    try {
      await action();
      await log.refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  const items = log.data?.items;

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-card bg-sand px-4 py-3 text-sm text-ink/80">
        Record what happens on site: visits, measurements, orders, deliveries and
        installation. Each entry is confirmed by the other side, so you both
        agree on the work done.
      </p>

      {active ? (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className={cn(cardSurface, 'flex flex-col gap-4 p-5')}
        >
          <h2 className="font-display text-xl font-semibold">Log work</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="What happened" htmlFor="work-type">
              <Select
                id="work-type"
                value={type}
                onChange={(value) => setType(value as WorkLogType)}
                options={TYPES.map(({ value, label }) => ({ value, label }))}
              />
            </Field>
            <Field label="When" htmlFor="work-when">
              <Input
                id="work-when"
                type="datetime-local"
                value={happenedAt}
                max={localNow()}
                onChange={(event) => setHappenedAt(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Title" htmlFor="work-title">
            <Input
              id="work-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Measured the living room and balcony"
              minLength={2}
              maxLength={120}
              required
            />
          </Field>
          <Field label="Details (optional)" htmlFor="work-note">
            <Textarea
              id="work-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              className="min-h-24"
            />
          </Field>
          <div>
            <FileUpload
              key={uploadKey}
              folder="attachments"
              accept="image/*"
              label="Add photos from site (optional)"
              onUploaded={(file) =>
                setPhotos((current) => [...current, file.url].slice(0, 10))
              }
            />
            {photos.length ? (
              <PhotoStrip photos={photos} className="mt-3" />
            ) : null}
          </div>
          {error ? <ErrorNotice message={error} /> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || title.trim().length < 2}>
              {saving ? 'Saving…' : 'Add to Work log'}
            </Button>
          </div>
        </form>
      ) : error ? (
        <ErrorNotice message={error} />
      ) : null}

      {log.loading && !items ? (
        <Skeleton className="h-40" />
      ) : log.error && !items ? (
        <ErrorNotice message={log.error} />
      ) : !items?.length ? (
        <EmptyState
          title="Nothing logged yet."
          description="Site visits, deliveries and installation will show here."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((entry) => {
            const meta = typeOf(entry.type);
            const Icon = meta.icon;
            const mine = entry.author.id === currentUserId;
            return (
              <li key={entry.id} className={cn(cardSurface, 'p-5')}>
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{entry.title}</p>
                        <p className="text-sm text-muted">
                          {meta.label} · {dateTime.format(new Date(entry.happenedAt))}
                          {entry.stageName
                            ? ` · ${titleCase(entry.stageName)} stage`
                            : ''}
                          {' · '}
                          {mine ? 'You' : entry.author.name}
                        </p>
                      </div>
                      {entry.confirmedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                          <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-sand px-3 py-1 text-xs font-semibold text-ink/70">
                          <Clock aria-hidden className="h-3.5 w-3.5" />
                          {mine
                            ? `Waiting for ${partnerName.split(' ')[0]}`
                            : 'Needs your confirmation'}
                        </span>
                      )}
                    </div>
                    {entry.note ? (
                      <p className="mt-2 whitespace-pre-line text-sm">
                        {entry.note}
                      </p>
                    ) : null}
                    {entry.photos.length ? (
                      <PhotoStrip photos={entry.photos} className="mt-3" />
                    ) : null}
                    {active && !entry.confirmedAt ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!mine ? (
                          <Button
                            size="sm"
                            disabled={busyId === entry.id}
                            onClick={() =>
                              void run(entry.id, () =>
                                api.patch(`/work-log/${entry.id}/confirm`),
                              )
                            }
                          >
                            Confirm it happened
                          </Button>
                        ) : (
                          <IconButton
                            action="delete"
                            label={`Delete "${entry.title}"`}
                            disabled={busyId === entry.id}
                            onClick={() =>
                              void run(entry.id, () =>
                                api.delete(`/work-log/${entry.id}`),
                              )
                            }
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function PhotoStrip({
  photos,
  className,
}: {
  photos: string[];
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {photos.map((url) => (
        <li key={url}>
          <a href={safeHref(url)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Site photo"
              className="h-20 w-20 rounded-card object-cover"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
