'use client';

import { Check, ChevronLeft, ChevronRight, Heart, ThumbsDown, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isOptimizableImage } from '@/lib/utils/images';
import type { Moodboard, MoodboardItem } from '@/lib/types';

const MOOD_WORDS = [
  'Calm',
  'Cosy',
  'Airy',
  'Warm',
  'Minimal',
  'Natural',
  'Fresh',
  'Bold',
  'Playful',
  'Luxurious',
];
const MAX_MOOD_WORDS = 3;

const PALETTE = [
  { name: 'Cream', hex: '#F3EBDD', light: true },
  { name: 'Sand', hex: '#D8C3A5', light: true },
  { name: 'Oak', hex: '#B98B5E' },
  { name: 'Walnut', hex: '#5C4033' },
  { name: 'Terracotta', hex: '#C0603F' },
  { name: 'Blush', hex: '#E8B4B0', light: true },
  { name: 'Sage', hex: '#9CAF88' },
  { name: 'Olive', hex: '#6B7445' },
  { name: 'Forest', hex: '#2F4F3A' },
  { name: 'Sky', hex: '#A9C7DB', light: true },
  { name: 'Navy', hex: '#22344F' },
  { name: 'Charcoal', hex: '#36393B' },
  { name: 'White', hex: '#FAFAF7', light: true },
  { name: 'Black', hex: '#151515' },
];
const MAX_PALETTE = 6;

const LOVES = ['Colour', 'Lighting', 'Furniture', 'Texture', 'Layout', 'Overall vibe'];

export const hexOf = (name: string) =>
  PALETTE.find((swatch) => swatch.name === name)?.hex;

const toggle = (list: string[], value: string, max: number) =>
  list.includes(value)
    ? list.filter((entry) => entry !== value)
    : list.length < max
      ? [...list, value]
      : list;

export type StyleChanges = Pick<Moodboard, 'moodWords' | 'palette' | 'savedItems'>;

export function hasStyle(board: Moodboard) {
  return (
    board.moodWords.length > 0 ||
    board.palette.length > 0 ||
    board.savedItems.some((item) => item.reaction || item.loves?.length)
  );
}

export function StyleSummary({ board }: { board: Moodboard }) {
  if (!hasStyle(board)) {
    return (
      <p className="max-w-md text-sm text-muted">
        Help designers understand your taste: how the room should feel, your
        colours, and what you love in each image.
      </p>
    );
  }
  const loved = board.savedItems.filter((item) => item.reaction === 'love').length;
  const disliked = board.savedItems.filter((item) => item.reaction === 'dislike').length;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {board.moodWords.length > 0 ? (
        <span className="font-semibold">{board.moodWords.join(' · ')}</span>
      ) : null}
      {board.palette.length > 0 ? (
        <span className="flex gap-1" title={board.palette.join(', ')}>
          {board.palette.map((swatch) => (
            <span
              key={swatch}
              className="h-5 w-5 rounded-full ring-1 ring-ink/10"
              style={{ backgroundColor: hexOf(swatch) }}
            />
          ))}
        </span>
      ) : null}
      {loved || disliked ? (
        <span className="text-muted">
          {loved} loved · {disliked} not for me
        </span>
      ) : null}
    </div>
  );
}

export function MoodWordPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {MOOD_WORDS.map((word) => {
        const on = value.includes(word);
        return (
          <button
            key={word}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle(value, word, MAX_MOOD_WORDS))}
            className={`rounded-lg border px-4 py-2.5 transition-colors ${
              on
                ? 'border-brand bg-brand text-canvas'
                : 'border-hairline hover:border-brand hover:text-brand'
            }`}
          >
            {word}
          </button>
        );
      })}
    </div>
  );
}

export function PalettePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
      {PALETTE.map((swatch) => {
        const on = value.includes(swatch.name);
        return (
          <button
            key={swatch.name}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle(value, swatch.name, MAX_PALETTE))}
            className="group flex flex-col items-center gap-1.5"
          >
            <span
              className={`grid h-12 w-12 place-items-center rounded-full ring-1 ring-ink/10 transition-transform group-hover:scale-105 ${
                on ? 'ring-2 ring-brand ring-offset-2' : ''
              }`}
              style={{ backgroundColor: swatch.hex }}
            >
              {on ? (
                <Check
                  aria-hidden
                  className={`h-5 w-5 ${swatch.light ? 'text-ink' : 'text-white'}`}
                />
              ) : null}
            </span>
            <span className={`text-xs ${on ? 'font-semibold text-ink' : 'text-muted'}`}>
              {swatch.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const TITLES = ['How should it feel?', 'Which colours feel right?', 'Tell us about your images'];
export const MOOD_HINT = `Pick up to ${MAX_MOOD_WORDS} words that describe the room you want.`;
export const PALETTE_HINT = `Pick up to ${MAX_PALETTE} colours you would like to see.`;
const HINTS = [
  MOOD_HINT,
  PALETTE_HINT,
  'Love it or not for you? Then tap what you love about it.',
];

export function StyleWizard({
  board,
  onClose,
  onSave,
}: {
  board: Moodboard;
  onClose: () => void;
  onSave: (changes: StyleChanges) => void;
}) {
  const [draft, setDraft] = useState<StyleChanges>({
    moodWords: board.moodWords,
    palette: board.palette,
    savedItems: board.savedItems,
  });
  const steps = board.savedItems.length > 0 ? 3 : 2;
  const [step, setStep] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const item = draft.savedItems[imageIndex];
  const lastImage = imageIndex === draft.savedItems.length - 1;
  const setItem = (change: Partial<MoodboardItem>) =>
    setDraft((current) => ({
      ...current,
      savedItems: current.savedItems.map((entry, i) =>
        i === imageIndex ? { ...entry, ...change } : entry,
      ),
    }));

  function back() {
    if (step === 3 && imageIndex > 0) setImageIndex(imageIndex - 1);
    else if (step > 1) setStep(step - 1);
    else onClose();
  }

  function next() {
    if (step === 3) setImageIndex(imageIndex + 1);
    else setStep(step + 1);
  }

  const finished = step === steps && (step !== 3 || lastImage);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-wizard-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-card bg-surface shadow-lift"
      >
        <div className="border-b border-hairline p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Step {step} of {steps}
              </p>
              <h2 id="style-wizard-title" className="mt-1 font-display text-xl font-semibold">
                {TITLES[step - 1]}
              </h2>
              <p className="mt-1 text-sm text-muted">{HINTS[step - 1]}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink hover:bg-sand"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {Array.from({ length: steps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-brand' : 'bg-sand'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            <MoodWordPicker
              value={draft.moodWords}
              onChange={(moodWords) => setDraft((current) => ({ ...current, moodWords }))}
            />
          ) : null}

          {step === 2 ? (
            <PalettePicker
              value={draft.palette}
              onChange={(palette) => setDraft((current) => ({ ...current, palette }))}
            />
          ) : null}

          {step === 3 && item ? (
            <div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sand">
                <Image
                  src={item.imageUrl}
                  unoptimized={!isOptimizableImage(item.imageUrl)}
                  alt={item.note ?? 'Moodboard image'}
                  fill
                  sizes="(min-width: 640px) 560px, 100vw"
                  className={`object-cover transition ${item.reaction === 'dislike' ? 'opacity-40 grayscale' : ''}`}
                />
                <span className="absolute left-3 top-3 rounded-pill bg-ink/70 px-2 py-0.5 text-xs text-canvas">
                  {imageIndex + 1} / {draft.savedItems.length}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={item.reaction === 'dislike'}
                  onClick={() =>
                    setItem({ reaction: item.reaction === 'dislike' ? undefined : 'dislike' })
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold transition-colors ${
                    item.reaction === 'dislike'
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-hairline hover:border-ink'
                  }`}
                >
                  <ThumbsDown aria-hidden className="h-5 w-5" /> Not for me
                </button>
                <button
                  type="button"
                  aria-pressed={item.reaction === 'love'}
                  onClick={() =>
                    setItem({ reaction: item.reaction === 'love' ? undefined : 'love' })
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 font-semibold transition-colors ${
                    item.reaction === 'love'
                      ? 'border-error bg-error text-white'
                      : 'border-hairline hover:border-error hover:text-error'
                  }`}
                >
                  <Heart
                    aria-hidden
                    className={`h-5 w-5 ${item.reaction === 'love' ? 'fill-current' : ''}`}
                  />
                  Love it
                </button>
              </div>
              {item.reaction !== 'dislike' ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold">What do you love about it?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LOVES.map((love) => {
                      const on = item.loves?.includes(love) ?? false;
                      return (
                        <button
                          key={love}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setItem({ loves: toggle(item.loves ?? [], love, LOVES.length) })
                          }
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            on
                              ? 'border-brand bg-brand-soft text-brand-deep'
                              : 'border-hairline text-muted hover:border-brand hover:text-brand'
                          }`}
                        >
                          {love}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hairline p-5">
          <Button variant="ghost" onClick={back}>
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft aria-hidden className="h-4 w-4" /> Back
              </>
            )}
          </Button>
          {finished ? (
            <Button onClick={() => onSave(draft)}>
              <Check aria-hidden className="h-4 w-4" /> Save my style
            </Button>
          ) : (
            <Button onClick={next}>
              {step === 3 ? 'Next image' : 'Next'}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
