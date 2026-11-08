'use client';

import { cardSurface } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export function Select({
  id,
  value,
  options,
  onChange,
  bare = false,
}: {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const [active, setActive] = useState(selectedIndex);
  const listId = `${id}-options`;

  function toggle() {
    setActive(selectedIndex);
    setOpen((current) => !current);
  }

  function select(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        toggle();
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) =>
        Math.min(Math.max(current + step, 0), options.length - 1),
      );
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      select(active);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        onClick={toggle}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        className={
          bare
            ? 'flex w-full items-center justify-between gap-3 bg-transparent p-0 text-left text-base font-medium text-ink focus:outline-none'
            : cn(cardSurface, 'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-base text-ink transition-colors duration-200 focus:border-brand focus:outline-none')
        }
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={cn(
            'h-4 w-4 shrink-0 text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className={cn(
            cardSurface,
            'absolute left-0 right-0 z-20 max-h-64 overflow-y-auto p-1 shadow-lift',
            bare ? 'mt-5' : 'mt-2',
          )}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(index)}
              className={cn(
                'cursor-pointer rounded-card px-4 py-2.5 text-ink transition-colors duration-150',
                index === active && 'bg-brand-soft text-brand',
                index === selectedIndex && 'font-semibold',
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
