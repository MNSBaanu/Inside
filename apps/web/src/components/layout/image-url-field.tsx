'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUGGESTED_IMAGES } from '@/lib/media';
import { cn } from '@/lib/utils';

type ImageUrlFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
};

export function ImageUrlField({
  id,
  label,
  value,
  onChange,
  hint = 'Pick a sample image or paste any URL.',
  className,
}: ImageUrlFieldProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="flex gap-3">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
          {value.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-[10px] uppercase tracking-wider text-muted-foreground">
              Preview
            </span>
          )}
        </div>
        <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-8">
          {SUGGESTED_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange(src)}
              aria-label="Use this image"
              className={cn(
                'aspect-square overflow-hidden rounded-lg border transition-all',
                value === src
                  ? 'border-primary shadow-[0_0_0_2px_oklch(0.38_0.06_155_/_0.2)]'
                  : 'border-border/60 hover:border-primary/40',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
