'use client';

import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { api, errorMessage } from '@/lib/api/client';
import { isOptimizableImage } from '@/lib/utils/images';
import {
  MOOD_HINT,
  MoodWordPicker,
  PALETTE_HINT,
  PalettePicker,
} from '@/components/features/moodboards/style-wizard';
import { MoodboardSheet } from '@/components/features/moodboards/moodboard-sheet';
import { useSession } from '@/components/providers/session-provider';
import type { Moodboard, MoodboardItem } from '@/lib/types';

const STEPS = [
  { title: 'Name your moodboard', hint: 'Something that tells you what it is for, e.g. Calm living room.' },
  { title: 'How should it feel?', hint: MOOD_HINT },
  { title: 'Which colours feel right?', hint: PALETTE_HINT },
  { title: 'Add some images', hint: 'Upload rooms or pieces you like. You can add more later.' },
  { title: 'Check your moodboard', hint: 'This is how your board will look. Go back to change anything.' },
];

/** Creates a moodboard step by step, or edits one with its details filled in. */
export function MoodboardWizard({
  board,
  onClose,
  onSaved,
}: {
  board?: Moodboard;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(board?.name ?? '');
  const [moodWords, setMoodWords] = useState<string[]>(board?.moodWords ?? []);
  const [palette, setPalette] = useState<string[]>(board?.palette ?? []);
  const [images, setImages] = useState<MoodboardItem[]>(board?.savedItems ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const last = step === STEPS.length - 1;
  const nameValid = name.trim().length >= 2;

  function next() {
    if (step === 0 && !nameValid) {
      setError('Give the moodboard a name of at least 2 characters.');
      return;
    }
    setError(null);
    setStep(step + 1);
  }

  const approved = board?.status === 'APPROVED';

  async function save() {
    setError(null);
    setBusy(true);
    const details = { name: name.trim(), moodWords, palette, savedItems: images };
    try {
      if (board) await api.patch(`/moodboards/${board.id}`, details);
      else await api.post('/moodboards', details);
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-moodboard-title"
        className={`flex max-h-[92vh] w-full flex-col ${last ? 'max-w-3xl' : 'max-w-xl'} overflow-hidden rounded-card bg-surface shadow-lift`}
      >
        <div className="border-b border-hairline p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 id="create-moodboard-title" className="mt-1 font-display text-xl font-semibold">
                {STEPS[step].title}
              </h2>
              <p className="mt-1 text-sm text-muted">{STEPS[step].hint}</p>
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
            {STEPS.map((entry, i) => (
              <span
                key={entry.title}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-sand'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {approved ? (
            <p className="mb-4 rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand-deep">
              A designer approved this board, so it stays as it is. Your changes will
              be saved as version {board.version + 1}.
            </p>
          ) : board?.status === 'CHANGES_REQUESTED' && board.reviewNote ? (
            <p className="mb-4 rounded-lg bg-highlight/15 px-4 py-3 text-sm">
              <span className="font-semibold">Your designer asked:</span> {board.reviewNote}
            </p>
          ) : null}

          {step === 0 ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                next();
              }}
            >
              <Input
                autoFocus
                aria-label="Moodboard name"
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Moodboard name"
              />
            </form>
          ) : null}

          {step === 1 ? <MoodWordPicker value={moodWords} onChange={setMoodWords} /> : null}

          {step === 2 ? <PalettePicker value={palette} onChange={setPalette} /> : null}

          {step === 3 ? (
            <div>
              {images.length > 0 ? (
                <ImageGrid
                  images={images.map((item) => item.imageUrl)}
                  onRemove={(index) =>
                    setImages((current) => current.filter((_, i) => i !== index))
                  }
                />
              ) : null}
              <FileUpload
                className={images.length > 0 ? 'mt-5' : undefined}
                folder="moodboards"
                label="Add images"
                existingHashes={images.flatMap((item) => (item.fileHash ? [item.fileHash] : []))}
                onUploadedMany={(files) =>
                  setImages((current) => [
                    ...current,
                    ...files.map((file) => ({ imageUrl: file.url, fileHash: file.fileHash })),
                  ])
                }
              />
            </div>
          ) : null}

          {step === 4 ? (
            <MoodboardSheet
              name={name.trim()}
              moodWords={moodWords}
              palette={palette}
              images={images
                .filter((item) => item.reaction !== 'dislike')
                .map((item) => item.imageUrl)}
              clientName={user?.name}
            />
          ) : null}

          {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hairline p-5">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            disabled={busy}
          >
            {step === 0 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft aria-hidden className="h-4 w-4" /> Back
              </>
            )}
          </Button>
          {last ? (
            <Button onClick={() => void save()} disabled={busy}>
              <Check aria-hidden className="h-4 w-4" />
              {busy
                ? 'Saving…'
                : !board
                  ? 'Create moodboard'
                  : approved
                    ? 'Save as new version'
                    : 'Save changes'}
            </Button>
          ) : (
            <Button onClick={next}>
              {step === 3 && images.length === 0 ? 'Skip' : 'Next'}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageGrid({
  images,
  onRemove,
}: {
  images: string[];
  onRemove?: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3">
      {images.map((url, index) => (
        <li key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-lg bg-sand">
          <Image
            src={url}
            unoptimized={!isOptimizableImage(url)}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
          />
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove image"
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-ink hover:text-error"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
