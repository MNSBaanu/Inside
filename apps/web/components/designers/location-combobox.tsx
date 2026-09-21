'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/field';
import { cn } from '@/lib/cn';

export function LocationCombobox({
  id,
  value,
  options,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = value.trim().toLowerCase();
  const matches = term
    ? [
        ...options.filter((option) => option.toLowerCase().startsWith(term)),
        ...options.filter(
          (option) =>
            !option.toLowerCase().startsWith(term) &&
            option.toLowerCase().includes(term),
        ),
      ]
    : options;
  const visible =
    open && matches.length > 0 && matches[0].toLowerCase() !== term
      ? matches
      : [];
  const listId = `${id}-options`;

  function select(option: string) {
    onChange(option);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(current + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && visible.length > 0) {
      event.preventDefault();
      select(visible[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          visible.length > 0 ? `${listId}-${active}` : undefined
        }
      />
      {visible.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-card border border-hairline bg-surface p-1 shadow-lift"
        >
          {visible.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(option)}
              className={cn(
                'cursor-pointer rounded-card px-4 py-2.5 text-ink transition-colors duration-150',
                index === active && 'bg-brand-soft text-brand',
              )}
            >
              {option}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
