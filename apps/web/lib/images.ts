const optimizedHosts = new Set(['res.cloudinary.com', 'images.unsplash.com']);

/** User images can live on any https host; only known hosts use the optimizer. */
export function isOptimizableImage(src: string) {
  try {
    return optimizedHosts.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

// Interior photography from Unsplash (free to use, no attribution required).
// Every id below was verified to resolve before being added.
const unsplash = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export const heroImage = unsplash('1600210491892-03d54c0aaf87', 2400, 1100);

export const featuredWork = [
  {
    id: 'kalutara-villa',
    title: 'Kalutara Villa',
    designer: 'Amara Weerasinghe',
    style: 'Tropical Modern',
    src: unsplash('1632119580908-ae947d4c7691', 1400, 1050),
  },
  {
    id: 'colombo-loft',
    title: 'Colombo Loft',
    designer: 'Devin Perera',
    style: 'Warm Minimal',
    src: unsplash('1600210491369-e753d80a41f3', 1400, 1050),
  },
  {
    id: 'galle-townhouse',
    title: 'Galle Townhouse',
    designer: 'Nadia Fernando',
    style: 'Coastal Classic',
    src: unsplash('1633330977020-2bdfb8530cc2', 1400, 1050),
  },
  {
    id: 'kandy-retreat',
    title: 'Kandy Retreat',
    designer: 'Roshan De Silva',
    style: 'Quiet Contemporary',
    src: unsplash('1688646953306-5ec93eab8c06', 1400, 1050),
  },
];

export const spotlightImage = unsplash('1637649228998-6c78a67dfa6c', 1200, 1500);
export const authImage = unsplash('1613545325278-f24b0cae1224', 1200, 1500);
