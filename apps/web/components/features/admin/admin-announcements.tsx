'use client';

import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  Results,
  SectionHeader,
  gridRow,
  useAdminAction,
  useAdminList,
} from '@/components/features/admin/admin-sections';
import {
  AnnouncementCard,
  type Announcement,
  type AnnouncementTone,
} from '@/components/features/announcements/announcement-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ErrorNotice } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

function localNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const AUDIENCES = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'CLIENTS', label: 'Clients' },
  { value: 'DESIGNERS', label: 'Designers' },
];

const audienceLabel = (value: string) =>
  AUDIENCES.find((a) => a.value === value)?.label ?? value;

const isLive = (item: Announcement) =>
  item.endsAt === null || new Date(item.endsAt) > new Date();

export function AnnouncementsSection() {
  const { list, page, setPage } = useAdminList<Announcement>('/admin/announcements', {});
  const { error, pending, run, dialog } = useAdminAction();
  const { confirm, dialog: sendDialog } = useConfirm();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [tone, setTone] = useState<AnnouncementTone>('INFO');
  const [endsAt, setEndsAt] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await confirm({
      title: `Send to ${audienceLabel(audience).toLowerCase()}?`,
      description:
        'Every matching active user gets a notification, and the banner shows at the top of their pages.',
      confirmLabel: 'Send announcement',
      tone: 'default',
    });
    if (!ok) return;
    setSendError(null);
    setSent(null);
    setSending(true);
    try {
      const result = await api.post<{ recipients: number }>('/admin/announcements', {
        title,
        message,
        audience,
        tone,
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
      });
      setSent(`Sent to ${result.recipients} ${result.recipients === 1 ? 'person' : 'people'}.`);
      setTitle('');
      setMessage('');
      setEndsAt('');
      void list.reload();
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {dialog}
      {sendDialog}
      <SectionHeader
        title="Announcements."
        description="Send a message to everyone, or only clients or designers. It arrives as a notification and a banner."
      />

      <form
        onSubmit={onSubmit}
        className={cn(cardSurface, 'grid gap-6 p-5 md:p-6 lg:grid-cols-2')}
      >
        <div className="flex flex-col gap-4">
          <Field label="Title" htmlFor="announcement-title">
            <Input
              id="announcement-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              maxLength={80}
              placeholder="Scheduled maintenance on Friday"
            />
          </Field>
          <Field label="Message" htmlFor="announcement-message" hint={`${message.length}/500`}>
            <Textarea
              id="announcement-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              minLength={3}
              maxLength={500}
              className="min-h-24"
              placeholder="Inside will be unavailable from 10pm to 11pm."
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Send to" htmlFor="announcement-audience">
              <Select
                id="announcement-audience"
                value={audience}
                options={AUDIENCES}
                onChange={(value) => setAudience(value || audience)}
              />
            </Field>
            <Field label="Show banner until" htmlFor="announcement-ends" hint="Optional">
              <Input
                id="announcement-ends"
                type="datetime-local"
                min={localNow()}
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="ui-label mb-2 text-ink/70">Style</legend>
            <div className="flex gap-2">
              {(['INFO', 'WARNING'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={tone === value}
                  onClick={() => setTone(value)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
                    tone === value
                      ? 'border-brand bg-brand text-canvas'
                      : 'border-ink/15 text-ink hover:bg-sand',
                  )}
                >
                  {value === 'INFO' ? 'Information' : 'Important'}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col gap-4">
          <p className="ui-label text-ink/70">Preview</p>
          <div className="rounded-card bg-canvas p-4">
            <AnnouncementCard title={title} message={message} tone={tone} />
          </div>
          {sendError ? <ErrorNotice message={sendError} /> : null}
          {sent ? (
            <p role="status" className="text-sm font-semibold text-success">
              {sent}
            </p>
          ) : null}
          <div className="mt-auto flex justify-end">
            <Button type="submit" disabled={sending}>
              <Send aria-hidden className="h-4 w-4" />
              {sending ? 'Sending…' : 'Send announcement'}
            </Button>
          </div>
        </div>
      </form>

      <h2 className="mb-3 mt-10 font-display text-lg font-semibold">Sent</h2>
      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={false}
        noun="announcements"
        empty="No announcements sent yet."
        actionError={error}
      >
        {(item) => (
          <li
            key={item.id}
            className={cn(gridRow, 'md:grid-cols-[minmax(0,1fr)_8rem_7rem_8rem] md:items-center')}
          >
            <div className="min-w-0">
              <p className="font-semibold">{item.title}</p>
              <p className="line-clamp-2 text-sm text-muted">{item.message}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDate(item.createdAt)}
                {item.endsAt ? ` · until ${formatDate(item.endsAt)}` : ''}
              </p>
            </div>
            <p className="text-sm">{audienceLabel(item.audience)}</p>
            <div>
              <Badge tone={isLive(item) ? 'brand' : 'neutral'}>
                {isLive(item) ? 'Showing' : 'Ended'}
              </Badge>
            </div>
            <div className="md:text-right">
              {isLive(item) ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending === item.id}
                  onClick={() =>
                    void run(item.id, `/admin/announcements/${item.id}/end`, list.reload, {}, {
                      title: `End "${item.title}"?`,
                      description:
                        'The banner stops showing. Notifications already sent stay in people’s inboxes.',
                      confirmLabel: 'End',
                    })
                  }
                >
                  End
                </Button>
              ) : null}
            </div>
          </li>
        )}
      </Results>
    </>
  );
}
