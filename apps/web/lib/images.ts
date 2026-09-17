// Placeholder photography. Swap these for curated interior shots before launch —
// tonal consistency across the set matters more than any individual image.
const placeholder = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

export const heroImage = placeholder('inside-hero', 2400, 1350);

export const featuredWork = [
  {
    id: 'kalutara-villa',
    title: 'Kalutara Villa',
    designer: 'Amara Weerasinghe',
    style: 'Tropical Modern',
    src: placeholder('inside-work-1', 1200, 1600),
  },
  {
    id: 'colombo-loft',
    title: 'Colombo Loft',
    designer: 'Devin Perera',
    style: 'Warm Minimal',
    src: placeholder('inside-work-2', 1600, 1200),
  },
  {
    id: 'galle-townhouse',
    title: 'Galle Townhouse',
    designer: 'Nadia Fernando',
    style: 'Coastal Classic',
    src: placeholder('inside-work-3', 1200, 1600),
  },
  {
    id: 'kandy-retreat',
    title: 'Kandy Retreat',
    designer: 'Roshan De Silva',
    style: 'Quiet Contemporary',
    src: placeholder('inside-work-4', 1200, 1600),
  },
];

export const spotlightImage = placeholder('inside-spotlight', 1600, 2000);
