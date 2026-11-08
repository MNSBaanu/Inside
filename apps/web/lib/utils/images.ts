import type { Hotspot } from '@/components/features/home/room-hotspots';

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

// Points on the hero photo (percent of the full image): room elements and Inside features.
export const heroHotspots: Hotspot[] = [
  { x: 48, y: 12, icon: 'lighting', title: 'Lighting', body: 'Set the perfect mood for your space.' },
  { x: 19, y: 35, icon: 'windows', title: 'Window Treatments', body: 'Control light, add privacy and elevate style.' },
  { x: 80, y: 30, icon: 'designer', title: 'Designers', body: 'Work with verified interior designers who match your brief.' },
  { x: 37, y: 41, icon: 'accessories', title: 'Accessories', body: 'Small details make a big difference.' },
  { x: 66, y: 46, icon: 'messages', title: 'Communication', body: 'Discuss ideas and share files with your designer in one place.' },
  { x: 52, y: 72, icon: 'palette', title: 'Colour Palette', body: 'Harmonious colours create a cohesive space. Save the ones you love to a moodboard.' },
  { x: 22, y: 84, icon: 'furniture', title: 'Furniture', body: 'Comfortable, stylish pieces for your lifestyle.' },
  { x: 80, y: 84, icon: 'payments', title: 'Payments', body: 'Pay per milestone, released as each stage is approved.' },
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
