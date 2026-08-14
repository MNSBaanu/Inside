'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InlineAlert } from '@/components/layout/inline-alert';
import { Skeleton } from '@/components/layout/skeleton';
import { formatApiError } from '@/lib/api/auth';
import {
  MESSAGE_MAX_LENGTH,
  listMessages,
  markMessageRead,
  markProjectMessagesRead,
  sendMessage,
} from '@/lib/api/messages';
import { ReportUserForm } from '@/components/trust/report-user-form';
import type { Message } from '@/lib/api/types';
import { formatClockTime, formatRelativeTime } from '@/lib/time';
import { usePoll } from '@/lib/use-poll';
import { cn } from '@/lib/utils';

const POLL_MS = 20_000;

export function ProjectChat({
  projectId,
  meId,
  counterpartyName,
  counterpartyId,
}: {
  projectId: string;
  meId: string;
  counterpartyName: string;
  counterpartyId?: string;
}) {
  const [items, setItems] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  const markRead = useCallback(
    async (messages: Message[]) => {
      const unread = messages.filter(
        (message) => message.receiverId === meId && !message.isRead,
      );
      if (unread.length === 0) return;
      try {
        if (unread.length === 1) {
          await markMessageRead(unread[0].id);
        } else {
          await markProjectMessagesRead(projectId);
        }
        setItems((prev) =>
          prev.map((message) =>
            message.receiverId === meId && !message.isRead
              ? { ...message, isRead: true }
              : message,
          ),
        );
      } catch {
        // A failed read receipt should not break the thread.
      }
    },
    [meId, projectId],
  );

  const load = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) setLoading(true);
      try {
        const data = await listMessages(projectId);
        setItems(data.items);
        setError(null);
        await markRead(data.items);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        if (!options.silent) setLoading(false);
      }
    },
    [markRead, projectId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  usePoll(() => void load({ silent: true }), POLL_MS);

  useEffect(() => {
    if (items.length === countRef.current) return;
    countRef.current = items.length;
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [items]);

  async function onSend() {
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await sendMessage(projectId, {
        content: text,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      setItems((prev) => [...prev, data.message]);
      setContent('');
      setAttachmentUrl('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSending(false);
    }
  }

  const remaining = MESSAGE_MAX_LENGTH - content.length;

  return (
    <section className="surface-panel space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Private thread with {counterpartyName}
        </p>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

      <div
        ref={threadRef}
        aria-live="polite"
        className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-border/60 bg-muted/25 p-4"
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-primary"
            >
              <MessageSquare className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello and share what you need next.
            </p>
          </div>
        ) : null}

        {items.map((message) => {
          const mine = message.senderId === meId;
          return (
            <div
              key={message.id}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] space-y-1 px-4 py-2.5 shadow-sm',
                  mine
                    ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-2xl rounded-bl-md border border-border/60 bg-background text-foreground',
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.attachmentUrl ? (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'block text-xs underline-offset-4 hover:underline',
                      mine ? 'text-primary-foreground/85' : 'text-primary',
                    )}
                  >
                    Attachment
                  </a>
                ) : null}
                <p
                  className={cn(
                    'text-[11px]',
                    mine
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground',
                  )}
                >
                  <time dateTime={message.sentAt} title={formatRelativeTime(message.sentAt)}>
                    {formatClockTime(message.sentAt)}
                  </time>
                  {mine && message.isRead ? ' · Read' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="message-content">Message</Label>
          <Textarea
            id="message-content"
            rows={3}
            value={content}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
            placeholder="Share an update, ask a question, or confirm the next step…"
          />
          {remaining < 200 ? (
            <p className="text-xs text-muted-foreground">
              {remaining} characters left
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="message-attachment">Attachment link (optional)</Label>
            <Input
              id="message-attachment"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://cdn.example.com/floor-plan.pdf"
            />
          </div>
          <Button
            type="button"
            disabled={sending || !content.trim()}
            onClick={() => void onSend()}
          >
            <Send aria-hidden="true" className="size-3.5" />
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter sends · Shift + Enter adds a line
        </p>
        {counterpartyId && items[0] ? (
          <ReportUserForm
            targetType="MESSAGE"
            targetId={items[items.length - 1]?.id ?? items[0].id}
            reportedUserId={counterpartyId}
            targetLabel="a message"
          />
        ) : null}
      </div>
    </section>
  );
}
