'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Message } from '@/lib/types';

export function MessageThread({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string;
}) {
  const { data, error, loading, reload } = useApi<{ items: Message[] }>(
    `/projects/${projectId}/messages`,
  );

  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const markingRef = useRef(false);

  const unreadForMe =
    data?.items.some(
      (message) => message.receiverId === currentUserId && !message.isRead,
    ) ?? false;

  useEffect(() => {
    if (!unreadForMe || markingRef.current) return;
    markingRef.current = true;
    void api
      .patch(`/projects/${projectId}/messages/read-all`, {})
      .then(() => reload())
      .catch(() => undefined)
      .finally(() => {
        markingRef.current = false;
      });
  }, [unreadForMe, projectId, reload]);

  useEffect(() => {
    const timer = setInterval(() => void reload(), 15000);
    return () => clearInterval(timer);
  }, [reload]);

  async function onSend(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSendError(null);
    setSending(true);
    try {
      await api.post(`/projects/${projectId}/messages`, {
        content: content.trim(),
      });
      setContent('');
      await reload();
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {error ? <ErrorNotice message={error} /> : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : data && data.items.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {data.items.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <li
                key={message.id}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-lg rounded-card px-5 py-4',
                    mine ? 'bg-brand text-canvas' : 'bg-sand text-ink',
                  )}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {message.attachmentUrl ? (
                    <a
                      href={message.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm underline underline-offset-4"
                    >
                      Attachment
                    </a>
                  ) : null}
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      mine ? 'text-canvas/70' : 'text-muted',
                    )}
                  >
                    {formatDate(message.sentAt)}
                    {mine && message.isRead ? ' · Read' : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No messages yet."
          description="Everything you agree here stays attached to the project."
        />
      )}

      <form onSubmit={onSend} className="mt-8 flex flex-col gap-4">
        {sendError ? <ErrorNotice message={sendError} /> : null}
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={4000}
          placeholder="Write a message…"
          className="min-h-24"
          aria-label="Message"
        />
        <div>
          <Button type="submit" disabled={sending || !content.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
