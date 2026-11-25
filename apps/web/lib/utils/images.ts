const optimizedHosts = new Set(['res.cloudinary.com', 'images.unsplash.com', 'images.pexels.com']);

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

// Pexels photos (free to use, no attribution required). Every id was verified to resolve.
const pexels = (id: number, width: number, height: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`;

export const heroImage = unsplash('1600210491892-03d54c0aaf87', 2400, 1100);
export const heroThumbImage = pexels(20390760, 400, 800);

// Each photo below is used in exactly one place on the public site.
export const homeStepImages = [9052854, 6583362, 6322367, 4174746, 8152751].map((id) =>
  pexels(id, 1200, 675),
);
export const homeRoleImages = [14505912, 3144580, 10153052].map((id) => pexels(id, 1200, 900));
export const homeAboutThumb = pexels(9565782, 520, 390);
export const hotspotImages = [3705529, 29383010, 7587314, 4740488].map((id) =>
  pexels(id, 320, 240),
);
export const workGridImages = [39733025, 33837741, 5793547, 5461586].map((id) =>
  pexels(id, 1400, 1050),
);
export const howItWorksImages = [31737843, 39404254, 7045924, 37252541, 5490384].map((id) =>
  pexels(id, 1200, 675),
);

/** A wide, cropped copy of a Cloudinary image for banners. Other hosts are returned unchanged. */
export function bannerImage(src: string) {
  return src.startsWith('https://res.cloudinary.com/')
    ? src.replace('/upload/', '/upload/c_fill,g_auto,w_2000,h_400/')
    : src;
}

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
