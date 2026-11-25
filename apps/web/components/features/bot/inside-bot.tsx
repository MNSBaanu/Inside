'use client';

import { Bot, Loader2, SendHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';

type Turn = { role: 'user' | 'bot'; text: string; suggestSupport?: boolean };

const STORAGE_KEY = 'inside-bot-chat';
const MAX_TURNS = 20;
const GREETING: Turn = {
  role: 'bot',
  text: 'Hi! I’m Inside Bot. Ask me how Inside works, or about your projects, payments and requests.',
};
const SUGGESTIONS = [
  'What stage is my project at?',
  'How do milestone payments work?',
  'How do I find a designer?',
];

/** Floating help assistant. Conversations stay in this browser tab only. */
export function InsideBot() {
  const pathname = usePathname();
  const { data } = useApi<{ enabled: boolean }>('/bot');
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTurns(JSON.parse(saved) as Turn[]);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turns));
  }, [turns]);

  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!data?.enabled || pathname.startsWith('/messages')) return null;

  async function ask(question: string) {
    const value = question.trim();
    if (!value || busy) return;
    const next = [...turns, { role: 'user' as const, text: value }];
    setTurns(next);
    setText('');
    setError(null);
    setBusy(true);
    try {
      const answer = await api.post<{ reply: string; suggestSupport: boolean }>(
        '/bot/ask',
        {
          turns: next
            .slice(-MAX_TURNS)
            .map(({ role, text: content }) => ({ role, text: content })),
        },
      );
      setTurns([
        ...next,
        { role: 'bot', text: answer.reply, suggestSupport: answer.suggestSupport },
      ]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const shown = [GREETING, ...turns];

  return (
    <div className="fixed bottom-5 right-5 z-[65] flex flex-col items-end gap-3">
      {open ? (
        <section
          aria-label="Inside Bot"
          className="flex h-[min(560px,calc(100dvh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-lift"
        >
          <header className="flex items-center gap-3 bg-brand px-4 py-3 text-canvas">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-canvas/15">
              <Bot aria-hidden className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Inside Bot</p>
              <p className="text-xs text-canvas/70">Answers in seconds</p>
            </div>
            {turns.length > 0 ? (
              <button
                type="button"
                onClick={() => setTurns([])}
                className="rounded-pill px-2.5 py-1 text-xs font-semibold text-canvas/80 hover:bg-canvas/15"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Inside Bot"
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-canvas/15"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 p-4">
            {shown.map((turn, index) => (
              <div
                key={index}
                className={cn('flex flex-col', turn.role === 'user' ? 'items-end' : 'items-start')}
              >
                <p
                  className={cn(
                    'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-sm',
                    turn.role === 'user'
                      ? 'bg-brand text-canvas'
                      : 'bg-surface text-ink ring-1 ring-hairline',
                  )}
                >
                  {turn.text}
                </p>
                {turn.suggestSupport ? (
                  <Link
                    href="/messages?support=1"
                    onClick={() => setOpen(false)}
                    className="mt-1.5 rounded-pill bg-brand-soft px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-canvas"
                  >
                    Talk to the Inside team
                  </Link>
                ) : null}
              </div>
            ))}
            {turns.length === 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void ask(suggestion)}
                    className="rounded-pill bg-surface px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-hairline hover:text-brand hover:ring-brand"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            {busy ? (
              <span className="flex w-fit gap-1 rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-hairline">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            ) : null}
            {error ? <p className="text-xs text-error">{error}</p> : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(text);
            }}
            className="flex items-center gap-2 border-t border-hairline bg-surface p-3"
          >
            <input
              ref={inputRef}
              value={text}
              maxLength={2000}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask Inside Bot…"
              aria-label="Ask Inside Bot"
              className="min-w-0 flex-1 rounded-pill border border-hairline bg-canvas px-4 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || busy}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-canvas hover:bg-brand-deep disabled:bg-sand disabled:text-muted"
            >
              {busy ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal aria-hidden className="h-4 w-4" />
              )}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close Inside Bot' : 'Ask Inside Bot'}
        aria-expanded={open}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand text-canvas shadow-lift transition-transform hover:scale-105 hover:bg-brand-deep"
      >
        {open ? <X aria-hidden className="h-6 w-6" /> : <Bot aria-hidden className="h-6 w-6" />}
      </button>
    </div>
  );
}
