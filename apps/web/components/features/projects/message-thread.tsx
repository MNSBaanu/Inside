'use client';

import {
  Check,
  CheckCheck,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  SendHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ReportDialog } from '@/components/features/moderation/report-dialog';
import { Avatar } from '@/components/ui/avatar';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { api, errorMessage } from '@/lib/api/client';
import { uploadFile, type UploadedFile } from '@/lib/api/upload';
import { useApi } from '@/lib/api/use-api';
import { getSocket, useSocketEvent } from '@/lib/realtime/socket';
import { cn } from '@/lib/utils/cn';
import { safeHref } from '@/lib/utils/url';
import type { Message, PartySummary } from '@/lib/types';

const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip';
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE = /^(jpe?g|png|webp|gif|avif)$/i;
const GROUP_GAP_MS = 5 * 60 * 1000;

/** Chat list and chat fill the window on desktop (below the app's top bar). */
export const CHAT_PANEL_HEIGHT = 'h-[min(72vh,680px)] lg:h-[calc(100dvh-7.5rem)]';

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function dayLabel(iso: string) {
  const day = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (day.toDateString() === today.toDateString()) return 'Today';
  if (day.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return day.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: day.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

/** Project chat between client and designer, laid out like a messenger. Updates live over the socket. */
export function MessageThread({
  projectId,
  currentUserId,
  partner,
  subtitle = 'Messages stay attached to this project',
  headerStart,
  headerAction,
  className,
  basePath = `/projects/${projectId}/messages`,
  projectRoom = true,
  emptyHint = 'Say hello. Everything you agree here stays attached to the project.',
  fill = false,
  partnerAvatar,
}: {
  fill?: boolean;
  partnerAvatar?: (size: number) => ReactNode;
  projectId: string;
  currentUserId: string;
  partner?: PartySummary | null;
  subtitle?: string;
  headerStart?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  basePath?: string;
  projectRoom?: boolean;
  emptyHint?: string;
}) {
  const { data, error, loading, reload } = useApi<{
    items: Message[];
    total?: number;
  }>(basePath);

  const [content, setContent] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const markingRef = useRef(false);
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [older, setOlder] = useState<Message[]>([]);
  const [olderPage, setOlderPage] = useState(2);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingSent = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const unreadForMe =
    data?.items.some((message) => message.receiverId === currentUserId && !message.isRead) ??
    false;

  const shown = [...older, ...(data?.items ?? [])].filter(
    (message, index, all) => all.findIndex((other) => other.id === message.id) === index,
  );
  const hasOlder = (data?.total ?? 0) > (data?.items.length ?? 0) + older.length;
  const lastId = shown[shown.length - 1]?.id;

  useEffect(() => {
    if (!unreadForMe || markingRef.current) return;
    markingRef.current = true;
    void api
      .patch(`${basePath}/read-all`, {})
      .then(() => reload())
      .catch(() => undefined)
      .finally(() => {
        markingRef.current = false;
      });
  }, [unreadForMe, basePath, reload]);

  useEffect(() => {
    if (!projectRoom) return;
    const socket = getSocket();
    const join = () => socket.emit('project:join', { projectId });
    socket.on('connect', join);
    if (socket.connected) join();
    return () => {
      socket.off('connect', join);
      socket.emit('project:leave', { projectId });
    };
  }, [projectId, projectRoom]);

  useSocketEvent<Message>('message:new', (message) => {
    if (message.projectId !== projectId) return;
    if (message.senderId !== currentUserId) setTypingName(null);
    void reload();
  });
  useSocketEvent<{ projectId: string; readerId: string }>('message:read', (event) => {
    if (event.projectId === projectId && event.readerId !== currentUserId) void reload();
  });
  useSocketEvent<{ projectId: string; userId: string; name: string }>('typing', (event) => {
    if (event.projectId !== projectId || event.userId === currentUserId) return;
    setTypingName(event.name);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingName(null), 3000);
  });
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  // Follow the conversation to the newest message unless the reader scrolled up.
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (box && atBottom.current) box.scrollTop = box.scrollHeight;
  }, [lastId, typingName]);

  function onScroll() {
    const box = scrollRef.current;
    if (!box) return;
    atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  function onType(value: string) {
    setContent(value);
    const box = textRef.current;
    if (box) {
      box.style.height = 'auto';
      box.style.height = `${Math.min(box.scrollHeight, 140)}px`;
    }
    const now = Date.now();
    if (value.trim() && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      if (projectRoom) getSocket().emit('typing', { projectId });
      else getSocket().emit('support:typing', { userId: projectId.replace(/^support:/, '') });
    }
  }

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setSendError('That file is too large (max 10 MB).');
      return;
    }
    setSendError(null);
    setUploadPercent(0);
    try {
      const uploaded = await uploadFile(file, 'attachments', (fraction) =>
        setUploadPercent(Math.round(fraction * 100)),
      );
      setAttachment(uploaded);
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setUploadPercent(null);
    }
  }

  async function send() {
    if ((!content.trim() && !attachment) || sending || uploadPercent !== null) return;
    setSendError(null);
    setSending(true);
    try {
      await api.post(basePath, {
        content: content.trim() || attachment?.fileName,
        ...(attachment
          ? {
              attachmentUrl: attachment.url,
              attachmentType: attachment.fileName.split('.').pop()?.slice(0, 100),
            }
          : {}),
      });
      setContent('');
      setAttachment(null);
      if (textRef.current) textRef.current.style.height = 'auto';
      atBottom.current = true;
      await reload();
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setSending(false);
      textRef.current?.focus();
    }
  }

  async function loadOlder() {
    setLoadingOlder(true);
    const box = scrollRef.current;
    const fromBottom = box ? box.scrollHeight - box.scrollTop : 0;
    try {
      const page = await api.get<{ items: Message[] }>(
        `${basePath}?page=${olderPage}`,
      );
      setOlder((current) => [...page.items, ...current]);
      setOlderPage((value) => value + 1);
      requestAnimationFrame(() => {
        if (box) box.scrollTop = box.scrollHeight - fromBottom;
      });
    } catch (cause) {
      setSendError(errorMessage(cause));
    } finally {
      setLoadingOlder(false);
    }
  }

  const canSend = (content.trim().length > 0 || attachment !== null) && !sending && uploadPercent === null;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-card border border-hairline bg-surface',
        fill ? CHAT_PANEL_HEIGHT : 'h-[min(72vh,680px)]',
        className,
      )}
    >
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        {headerStart}
        {partnerAvatar ? (
          partnerAvatar(40)
        ) : partner ? (
          <Avatar name={partner.name} src={partner.avatarUrl} size={40} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{partner?.name ?? 'Project chat'}</p>
          <p className="h-4 truncate text-xs text-muted" aria-live="polite">
            {typingName ? <span className="text-brand">typing…</span> : subtitle}
          </p>
        </div>
        {headerAction}
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto bg-canvas/60 px-3 py-4 sm:px-5"
      >
        {error ? <ErrorNotice message={error} /> : null}

        {hasOlder ? (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              disabled={loadingOlder}
              onClick={() => void loadOlder()}
              className="rounded-pill bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm ring-1 ring-hairline hover:text-brand"
            >
              {loadingOlder ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-3/5" />
          </div>
        ) : shown.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <MessageCircle aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-3 font-semibold text-ink">No messages yet</p>
            <p className="mt-1 max-w-xs text-sm">{emptyHint}</p>
          </div>
        ) : (
          <ol className="flex flex-col">
            {shown.map((message, index) => {
              const mine = message.senderId === currentUserId;
              const previous = shown[index - 1];
              const next = shown[index + 1];
              const newDay =
                !previous ||
                new Date(previous.sentAt).toDateString() !==
                  new Date(message.sentAt).toDateString();
              const joinsPrevious =
                !newDay &&
                previous?.senderId === message.senderId &&
                new Date(message.sentAt).getTime() - new Date(previous.sentAt).getTime() <
                  GROUP_GAP_MS;
              const joinsNext =
                next?.senderId === message.senderId &&
                new Date(next.sentAt).toDateString() ===
                  new Date(message.sentAt).toDateString() &&
                new Date(next.sentAt).getTime() - new Date(message.sentAt).getTime() <
                  GROUP_GAP_MS;
              const ext = message.attachmentType ?? '';
              const isImage = Boolean(message.attachmentUrl) && IMAGE.test(ext);
              const fileOnly =
                Boolean(message.attachmentUrl) &&
                message.content.trim().toLowerCase().endsWith(`.${ext.toLowerCase()}`);
              const sender = message.sender ?? (mine ? null : partner);

              return (
                <li key={message.id}>
                  {newDay ? (
                    <div className="my-3 flex justify-center">
                      <span className="rounded-pill bg-surface px-3 py-1 text-xs font-medium text-muted ring-1 ring-hairline">
                        {dayLabel(message.sentAt)}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      'group flex items-end gap-2',
                      mine ? 'justify-end' : 'justify-start',
                      joinsPrevious ? 'mt-0.5' : 'mt-3',
                    )}
                  >
                    {!mine ? (
                      <span className="w-8 shrink-0">
                        {!joinsNext && sender ? (
                          partnerAvatar && sender.id === partner?.id ? (
                            partnerAvatar(32)
                          ) : (
                            <Avatar name={sender.name} src={sender.avatarUrl} size={32} />
                          )
                        ) : null}
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        'max-w-[78%] overflow-hidden rounded-2xl text-[15px] leading-snug shadow-sm sm:max-w-md',
                        mine ? 'bg-brand text-canvas' : 'bg-surface text-ink ring-1 ring-hairline',
                        mine
                          ? cn(joinsPrevious && 'rounded-tr-md', joinsNext && 'rounded-br-md')
                          : cn(joinsPrevious && 'rounded-tl-md', joinsNext && 'rounded-bl-md'),
                      )}
                    >
                      {isImage ? (
                        <a href={safeHref(message.attachmentUrl!)} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.attachmentUrl!}
                            alt={fileOnly ? message.content : 'Attached image'}
                            className="max-h-72 w-full object-cover"
                          />
                        </a>
                      ) : message.attachmentUrl ? (
                        <a
                          href={safeHref(message.attachmentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            'm-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5',
                            mine ? 'bg-canvas/15 hover:bg-canvas/25' : 'bg-sand hover:bg-sand/70',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                              mine ? 'bg-canvas/20' : 'bg-surface text-brand',
                            )}
                          >
                            <FileText aria-hidden className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {fileOnly ? message.content : `Attachment.${ext || 'file'}`}
                            </span>
                            <span className={cn('text-xs', mine ? 'text-canvas/70' : 'text-muted')}>
                              {ext ? ext.toUpperCase() : 'File'} · Open
                            </span>
                          </span>
                        </a>
                      ) : null}
                      <div className="px-3.5 pb-1.5 pt-2">
                        {!fileOnly ? (
                          <p className="whitespace-pre-line break-words">{message.content}</p>
                        ) : null}
                        <p
                          className={cn(
                            'flex items-center justify-end gap-1 text-[11px]',
                            !fileOnly && 'mt-0.5',
                            mine ? 'text-canvas/70' : 'text-muted',
                          )}
                        >
                          {timeOf(message.sentAt)}
                          {mine ? (
                            message.isRead ? (
                              <CheckCheck aria-label="Read" className="h-4 w-4 text-[#53BDEB]" />
                            ) : (
                              <Check aria-label="Sent" className="h-3.5 w-3.5" />
                            )
                          ) : null}
                        </p>
                      </div>
                    </div>
                    {!mine && projectRoom && !message.isHidden ? (
                      <span className="self-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <ReportDialog targetType="MESSAGE" targetId={message.id} icon label="Report message" />
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {typingName ? (
          <div className="mt-3 flex items-end gap-2" aria-hidden>
            <span className="w-8" />
            <span className="flex gap-1 rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-hairline">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="border-t border-hairline bg-surface p-3"
      >
        {sendError ? (
          <div className="mb-2">
            <ErrorNotice message={sendError} />
          </div>
        ) : null}

        {attachment || uploadPercent !== null ? (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-sand/70 px-3 py-2 text-sm">
            {uploadPercent !== null ? (
              <Loader2 aria-hidden className="h-4 w-4 shrink-0 animate-spin text-brand" />
            ) : (
              <FileText aria-hidden className="h-4 w-4 shrink-0 text-brand" />
            )}
            <span className="min-w-0 flex-1 truncate">
              {uploadPercent !== null ? `Uploading… ${uploadPercent}%` : attachment?.fileName}
            </span>
            {attachment ? (
              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
                className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-error"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => void onPickFile(event)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploadPercent !== null || sending}
            aria-label="Attach a file"
            title="Attach a file"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-brand disabled:opacity-50"
          >
            <Paperclip aria-hidden className="h-5 w-5" />
          </button>
          <textarea
            ref={textRef}
            rows={1}
            value={content}
            maxLength={4000}
            onChange={(event) => onType(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-36 min-h-11 flex-1 resize-none rounded-3xl border border-hairline bg-canvas px-4 py-2.5 text-[15px] leading-snug text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-canvas transition-colors hover:bg-brand-deep disabled:bg-sand disabled:text-muted"
          >
            {sending ? (
              <Loader2 aria-hidden className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 hidden px-14 text-[11px] text-muted sm:block">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </div>
  );
}
