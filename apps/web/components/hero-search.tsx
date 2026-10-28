'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/field';
import { LOCATIONS } from '@/lib/options';

export function HeroSearch() {
  const [location, setLocation] = useState('');

  return (
    <form
      action="/designers"
      className="mt-4 grid gap-3 rounded-card border border-hairline bg-surface p-3 sm:grid-cols-[2fr_1fr_auto]"
    >
      <Input
        name="q"
        type="search"
        aria-label="Search designers"
        placeholder="Designer name or keyword"
        autoComplete="off"
      />
      <Combobox
        id="hero-location"
        name="location"
        value={location}
        options={LOCATIONS}
        onChange={setLocation}
        placeholder="Location, e.g. Colombo"
        ariaLabel="Location"
      />
      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  );
}
