import type { Prisma } from '@prisma/client';

const photo = (id: string, width = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const productId = (n: number) =>
  `00000007-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

type Seed = Omit<Prisma.ProductCreateManyInput, 'id' | 'imageUrl' | 'sellerUrl'> & {
  image: string;
  slug: string;
};

const SEEDS: Seed[] = [
  {
    slug: 'oak-lounge-sofa',
    name: 'Oak Lounge Sofa',
    description:
      'A low, deep three-seater with a solid oak frame and a washable linen-blend cover. Built to sit comfortably in a living room that gets used every day.',
    category: 'Seating',
    style: 'Scandinavian',
    price: 189000,
    sellerName: 'Atelier Colombo',
    image: '1560448204-e02f11c3d0e2',
  },
  {
    slug: 'sand-boucle-armchair',
    name: 'Sand Bouclé Armchair',
    description:
      'A rounded armchair in soft, textured bouclé. The wide seat and curved back make it a good reading corner.',
    category: 'Seating',
    style: 'Contemporary',
    price: 78500,
    sellerName: 'Maison Kandy',
    image: '1586023492125-27b2c045efd7',
  },
  {
    slug: 'teak-dining-table',
    name: 'Teak Dining Table',
    description:
      'Solid reclaimed teak with a hand-rubbed oil finish. Seats six, and the top ages well.',
    category: 'Tables',
    style: 'Tropical Modern',
    price: 154000,
    sellerName: 'Heritage Woodworks',
    image: '1556912173-46c336c7fd55',
  },
  {
    slug: 'round-coffee-table',
    name: 'Round Coffee Table',
    description:
      'A low round table in light ash with a rounded edge, sized for a small living room.',
    category: 'Tables',
    style: 'Japandi',
    price: 42500,
    sellerName: 'Atelier Colombo',
    image: '1616137466211-f947bda0ca6d',
  },
  {
    slug: 'woven-pendant-light',
    name: 'Woven Pendant Light',
    description:
      'A hand-woven rattan shade that casts a warm, patterned glow. Comes with a three-metre cord.',
    category: 'Lighting',
    style: 'Coastal',
    price: 18900,
    sellerName: 'Lanka Lumen',
    image: '1616594039964-ae9021a400a0',
  },
  {
    slug: 'brass-floor-lamp',
    name: 'Brass Floor Lamp',
    description:
      'A slim arched lamp with a brushed brass finish and a linen shade. Good beside a sofa.',
    category: 'Lighting',
    style: 'Traditional',
    price: 34500,
    sellerName: 'Lanka Lumen',
    image: '1613545325278-f24b0cae1224',
  },
  {
    slug: 'open-shelf-unit',
    name: 'Open Shelf Unit',
    description:
      'A five-tier shelving unit with a slim steel frame and oak shelves. Works as a room divider.',
    category: 'Storage',
    style: 'Industrial',
    price: 67000,
    sellerName: 'Forge & Grain',
    image: '1616486338812-3dadae4b4ace',
  },
  {
    slug: 'low-media-console',
    name: 'Low Media Console',
    description:
      'A long, low console with sliding cane doors and room for cables and a soundbar.',
    category: 'Storage',
    style: 'Minimalist',
    price: 96000,
    sellerName: 'Maison Kandy',
    image: '1600210491892-03d54c0aaf87',
  },
  {
    slug: 'hand-knotted-wool-rug',
    name: 'Hand-knotted Wool Rug',
    description:
      'A 2 by 3 metre wool rug in natural cream with a subtle geometric pattern, knotted by hand.',
    category: 'Rugs',
    style: 'Bohemian',
    price: 112000,
    sellerName: 'Loom & Thread',
    image: '1632119580908-ae947d4c7691',
  },
  {
    slug: 'flatweave-jute-rug',
    name: 'Flatweave Jute Rug',
    description:
      'A hard-wearing natural jute rug with a flat weave, suited to hallways and dining areas.',
    category: 'Rugs',
    style: 'Coastal',
    price: 38000,
    sellerName: 'Loom & Thread',
    image: '1600210491369-e753d80a41f3',
  },
  {
    slug: 'ceramic-table-vase-set',
    name: 'Ceramic Table Vase Set',
    description:
      'A set of three glazed stoneware vases in matte earth tones, thrown and finished by hand.',
    category: 'Decor',
    style: 'Japandi',
    price: 12800,
    sellerName: 'Clay Studio Galle',
    image: '1633330977020-2bdfb8530cc2',
  },
  {
    slug: 'framed-botanical-prints',
    name: 'Framed Botanical Prints',
    description:
      'Two framed botanical prints on textured paper with oak frames. Ready to hang.',
    category: 'Decor',
    style: 'Traditional',
    price: 16500,
    sellerName: 'Clay Studio Galle',
    image: '1688646953306-5ec93eab8c06',
  },
  {
    slug: 'linen-bed-set',
    name: 'Washed Linen Bed Set',
    description:
      'A duvet cover and two pillowcases in stonewashed linen that softens with every wash.',
    category: 'Bedroom',
    style: 'Minimalist',
    price: 29500,
    sellerName: 'Loom & Thread',
    image: '1616594039964-ae9021a400a0',
  },
  {
    slug: 'rattan-bedside-table',
    name: 'Rattan Bedside Table',
    description:
      'A compact bedside table with a rattan front and one deep drawer.',
    category: 'Bedroom',
    style: 'Tropical Modern',
    price: 31500,
    sellerName: 'Heritage Woodworks',
    image: '1637649228998-6c78a67dfa6c',
  },
  {
    slug: 'standing-mirror',
    name: 'Arched Standing Mirror',
    description:
      'A full-length arched mirror in a thin black frame. Leans against a wall, no drilling needed.',
    category: 'Decor',
    style: 'Contemporary',
    price: 24500,
    sellerName: 'Forge & Grain',
    image: '1616137466211-f947bda0ca6d',
  },
  {
    slug: 'outdoor-lounge-chair',
    name: 'Outdoor Lounge Chair',
    description:
      'A weather-resistant lounge chair in powder-coated aluminium with quick-dry cushions.',
    category: 'Seating',
    style: 'Tropical Modern',
    price: 52000,
    sellerName: 'Atelier Colombo',
    image: '1600210491892-03d54c0aaf87',
  },
];

export const PRODUCT_SEED: Prisma.ProductCreateManyInput[] = SEEDS.map(
  ({ image, slug, ...rest }, index) => ({
    ...rest,
    id: productId(index + 1),
    imageUrl: photo(image),
    sellerUrl: `https://example.com/shop/${slug}`,
  }),
);
