export type TaxonomyOption = {
  label: string;
  image: string;
};

/** Style values match `Portfolio.style` strings used by the API filters. */
export const STYLE_OPTIONS: readonly TaxonomyOption[] = [
  {
    label: 'Scandinavian',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Industrial',
    image:
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Coastal',
    image:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Minimalist',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Mid-century',
    image:
      'https://images.unsplash.com/photo-1615874959471-d2fa0db0afa0?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Bohemian',
    image:
      'https://images.unsplash.com/photo-1616137466211-f947bda0ca6d?auto=format&fit=crop&w=600&q=80',
  },
] as const;

/** Room values match `Portfolio.roomType` strings used by the API filters. */
export const ROOM_OPTIONS: readonly TaxonomyOption[] = [
  {
    label: 'Living Room',
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Kitchen',
    image:
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Bedroom',
    image:
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Dining Room',
    image:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Home Office',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
  {
    label: 'Bathroom',
    image:
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80',
  },
] as const;

export type BudgetBand = {
  label: string;
  /** Upper bound in LKR, used for the discovery `maxBudget` filter. */
  maxBudget: number;
  /** Stored on briefs as a human-readable range. */
  range: string;
};

export const BUDGET_BANDS: readonly BudgetBand[] = [
  { label: 'Under 300k', maxBudget: 300000, range: '0-300000' },
  { label: '300k – 500k', maxBudget: 500000, range: '300000-500000' },
  { label: '500k – 800k', maxBudget: 800000, range: '500000-800000' },
  { label: '800k +', maxBudget: 5000000, range: '800000+' },
] as const;
