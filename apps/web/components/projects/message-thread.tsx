'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { EmptyState, ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { safeHref } from '@/lib/url';
import { useApi } from '@/lib/use-api';
import type { Message } from '@/lib/types';
import { FileUpload } from '@/components/ui/file-upload';
import type { UploadedFile } from '@/lib/upload';

export function MessageThread({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string;
}) {
  const { data, error, loading, reload } = useApi<{
    items: Message[];
    total?: number;
  }>(
    `/projects/${projectId}/messages`,
  );

  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const markingRef = useRef(false);
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [older, setOlder] = useState<Message[]>([]);
  const [olderPage, setOlderPage] = useState(2);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const unreadForMe =
    data?.items.some(
      (message) => message.receiverId === currentUserId && !message.isRead,
    ) ?? false;

  const shown = [...older, ...(data?.items ?? [])].filter(
    (message, index, all) =>
      all.findIndex((other) => other.id === message.id) === index,
  );
  const hasOlder =
    (data?.total ?? 0) > (data?.items.length ?? 0) + older.length;

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
    const timer = setInterval(() => {
      if (!document.hidden) void reload();
    }, 15000);
    return () => clearInterval(timer);
  }, [reload]);

  async function onSend(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim() && !attachment) return;
    setSendError(null);
    setSending(true);
    try {
      await api.post(`/projects/${projectId}/messages`, {
        content: content.trim() || attachment?.fileName,
        ...(attachment
          ? {
              attachmentUrl: attachment.url,
              attachmentType: attachment.fileName
                .split('.')
                .pop()
                ?.slice(0, 100),
            }
          : {}),
      });
      setContent('');
      setAttachment(null);
      setUploadKey((key) => key + 1);
      await reload();
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  }

  async function loadOlder() {
    setLoadingOlder(true);
    try {
      const page = await api.get<{ items: Message[] }>(
        `/projects/${projectId}/messages?page=${olderPage}`,
      );
      setOlder((current) => [...page.items, ...current]);
      setOlderPage((value) => value + 1);
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setLoadingOlder(false);
    }
  }

  return (
    <div>
      {error ? <ErrorNotice message={error} /> : null}

      {hasOlder ? (
        <div className="mb-4 flex justify-center">
          <Button
            size="sm"
            variant="ghost"
            disabled={loadingOlder}
            onClick={() => void loadOlder()}
          >
            {loadingOlder ? 'Loading…' : 'Load older messages'}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : shown.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {shown.map((message) => {
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
                      href={safeHref(message.attachmentUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm underline underline-offset-4"
                    >
                      {message.attachmentType
                        ? `Attachment (${message.attachmentType})`
                        : 'Attachment'}
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
        <FileUpload
          key={uploadKey}
          folder="attachments"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          label="Attach a file (optional)"
          onUploaded={setAttachment}
        />
        <div>
          <Button
            type="submit"
            disabled={sending || (!content.trim() && !attachment)}
          >
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
