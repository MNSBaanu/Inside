'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './badge';
import { Input } from './field';

export function TagInput({
  id,
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState('');

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || values.includes(trimmed) || values.length >= 20) return;
    onChange([...values, trimmed]);
    setDraft('');
  }

  function remove(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            add(draft);
          }
        }}
      />

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => remove(value)}
                aria-label={`Remove ${value}`}
                className="rounded-pill"
              >
                <Badge tone="brand">
                  {value}
                  <X aria-hidden className="ml-1 inline h-3 w-3" />
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {suggestions
            .filter((suggestion) => !values.includes(suggestion))
            .map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => add(suggestion)}
                  className="inline-flex items-center gap-1 rounded-pill border border-hairline px-3 py-1.5 text-label font-semibold uppercase text-muted transition-colors duration-300 hover:border-brand hover:text-brand"
                >
                  <Plus aria-hidden className="h-3 w-3" />
                  {suggestion}
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
