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
export const heroImageAspect = 2400 / 1100;

// Points on the hero photo (percent of the full image) with a design tip for each.
export const heroHotspots = [
  {
    x: 48,
    y: 12,
    title: 'Statement lighting',
    body: 'One sculptural pendant anchors the room. Add lamps and wall lights on separate switches so evenings feel warm, not flat.',
  },
  {
    x: 19,
    y: 35,
    title: 'Frame the view',
    body: 'Tall arched windows pull in daylight. Keep window treatments light so the garden becomes part of the room.',
  },
  {
    x: 37,
    y: 41,
    title: 'Style in threes',
    body: 'Groups of three, like the clock, lanterns and plant on this mantel, look natural. Vary the heights to lead the eye.',
  },
  {
    x: 52,
    y: 72,
    title: 'A textured focal point',
    body: 'Painted brick adds texture without darkening the space. Arrange seating to face the fireplace for easy conversation.',
  },
  {
    x: 80,
    y: 84,
    title: 'Layer soft textures',
    body: 'Mix knits, linen and patterned cushions within one palette. The room feels cosy while staying calm.',
  },
];

export const featuredWork = [
  {
    id: 'kalutara-villa',
    title: 'Kalutara Villa',
    style: 'Tropical Modern',
    src: unsplash('1632119580908-ae947d4c7691', 1400, 1050),
  },
  {
    id: 'colombo-loft',
    title: 'Colombo Loft',
    style: 'Warm Minimal',
    src: unsplash('1600210491369-e753d80a41f3', 1400, 1050),
  },
  {
    id: 'galle-townhouse',
    title: 'Galle Townhouse',
    style: 'Coastal Classic',
    src: unsplash('1633330977020-2bdfb8530cc2', 1400, 1050),
  },
  {
    id: 'kandy-retreat',
    title: 'Kandy Retreat',
    style: 'Quiet Contemporary',
    src: unsplash('1688646953306-5ec93eab8c06', 1400, 1050),
  },
];

export const spotlightImage = unsplash('1637649228998-6c78a67dfa6c', 1200, 1500);
export const authImage = unsplash('1613545325278-f24b0cae1224', 1200, 1500);
