'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { BareInput } from '@/components/ui/field';
import { FilterAction, FilterBar, FilterField } from '@/components/ui/filter-bar';
import { LOCATIONS } from '@/lib/utils/options';

export function HeroSearch() {
  const [location, setLocation] = useState('');

  return (
    <FilterBar action="/explore" className="mt-4">
      <input type="hidden" name="tab" value="designers" />
      <FilterField label="Search" htmlFor="hero-q">
        <BareInput
          id="hero-q"
          name="q"
          type="search"
          aria-label="Search designers"
          placeholder="Designer name or keyword"
          autoComplete="off"
        />
      </FilterField>
      <FilterField label="Location" htmlFor="hero-location">
        <Combobox
          bare
          id="hero-location"
          name="location"
          value={location}
          options={LOCATIONS}
          onChange={setLocation}
          placeholder="Anywhere, e.g. Colombo"
          ariaLabel="Location"
        />
      </FilterField>
      <FilterAction>
        <Button type="submit" size="md">
          Search
        </Button>
      </FilterAction>
    </FilterBar>
  );
}
