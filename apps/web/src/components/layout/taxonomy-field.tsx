'use client';

import { useMemo } from 'react';
import { FilterChips } from '@/components/layout/filter-chips';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TaxonomyFieldProps = {
  id: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * Chips keep designer input aligned with the discovery filters, while the
 * free-text field still allows values outside the curated list.
 */
export function TaxonomyField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
}: TaxonomyFieldProps) {
  const chipOptions = useMemo(
    () =>
      value && !options.includes(value) ? [...options, value] : [...options],
    [options, value],
  );

  return (
    <div className="space-y-3">
      <FilterChips
        label={label}
        options={chipOptions}
        value={value}
        onChange={onChange}
      />
      <div className="space-y-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Or type your own
        </Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
