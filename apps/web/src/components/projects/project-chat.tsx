'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatApiError } from '@/lib/api/auth';
import {
  MESSAGE_MAX_LENGTH,
  listMessages,
  markProjectMessagesRead,
  sendMessage,
} from '@/lib/api/messages';
import type { Message } from '@/lib/api/types';
import { formatClockTime, formatRelativeTime } from '@/lib/time';
import { usePoll } from '@/lib/use-poll';
import { cn } from '@/lib/utils';

const POLL_MS = 20_000;

export function ProjectChat({
  projectId,
  meId,
  counterpartyName,
}: {
  projectId: string;
  meId: string;
  counterpartyName: string;
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
      const unread = messages.some(
        (message) => message.receiverId === meId && !message.isRead,
      );
      if (!unread) return;
      try {
        await markProjectMessagesRead(projectId);
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

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div
        ref={threadRef}
        aria-live="polite"
        className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-border/60 p-4"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : null}

        {!loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages yet. Say hello and share what you need next.
          </p>
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
                  'max-w-[85%] space-y-1 rounded-2xl px-4 py-2.5',
                  mine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
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
          <textarea
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
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter sends · Shift + Enter adds a line
        </p>
      </div>
    </section>
  );
}
