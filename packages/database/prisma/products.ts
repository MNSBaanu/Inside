import type { Prisma } from '@prisma/client';

// Each image is a real Unsplash photo of the item itself (free to use).
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
      'A low, deep three-seater with a solid oak base and a soft grey linen-blend cover. Built to sit comfortably in a living room that gets used every day.',
    category: 'Seating',
    style: 'Scandinavian',
    price: 189000,
    sellerName: 'Atelier Colombo',
    image: '1698936061086-2bf99c7b9fc5',
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
    image: '1759262151001-3f8841d02ce1',
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
    image: '1576249720336-35b043fce96d',
  },
  {
    slug: 'round-coffee-table',
    name: 'Round Coffee Table',
    description:
      'A low round table in light ash with slim splayed legs, sized for a small living room.',
    category: 'Tables',
    style: 'Japandi',
    price: 42500,
    sellerName: 'Atelier Colombo',
    image: '1510877073473-6d4545e9c2af',
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
    image: '1578678809569-1a8ead9cb802',
  },
  {
    slug: 'brass-floor-lamp',
    name: 'Brass Floor Lamp',
    description:
      'A slim floor lamp with a brass-finish stem and a pleated linen shade. Good beside a sofa.',
    category: 'Lighting',
    style: 'Traditional',
    price: 34500,
    sellerName: 'Lanka Lumen',
    image: '1759647020559-2f91a4290ae4',
  },
  {
    slug: 'oak-bookshelf',
    name: 'Oak Bookshelf',
    description:
      'A tall open bookcase in solid wood with five fixed shelves. Holds a whole library, and works as a room divider.',
    category: 'Storage',
    style: 'Traditional',
    price: 67000,
    sellerName: 'Forge & Grain',
    image: '1588580000645-4562a6d2c839',
  },
  {
    slug: 'low-media-console',
    name: 'Fluted Media Console',
    description:
      'A long, low console with fluted wooden doors and room for cables and a soundbar.',
    category: 'Storage',
    style: 'Minimalist',
    price: 96000,
    sellerName: 'Maison Kandy',
    image: '1767963758785-b9def36c13e3',
  },
  {
    slug: 'wool-pile-rug',
    name: 'Wool Pile Rug',
    description:
      'A thick, soft wool pile rug in natural grey and brown tones, made for bare feet in a bedroom or living room.',
    category: 'Rugs',
    style: 'Contemporary',
    price: 112000,
    sellerName: 'Loom & Thread',
    image: '1564444247765-a377a8bfd0b8',
  },
  {
    slug: 'round-jute-rug',
    name: 'Round Jute Rug',
    description:
      'A hard-wearing round jute rug with a white scalloped edge, suited to hallways and dining areas.',
    category: 'Rugs',
    style: 'Coastal',
    price: 38000,
    sellerName: 'Loom & Thread',
    image: '1762758889413-64d717f81b0d',
  },
  {
    slug: 'ceramic-table-vase-set',
    name: 'Ceramic Table Vase Set',
    description:
      'A set of three hand-finished clay vases in soft earth tones, made to sit together on a table.',
    category: 'Decor',
    style: 'Japandi',
    price: 12800,
    sellerName: 'Clay Studio Galle',
    image: '1631125915902-d8abe9225ff2',
  },
  {
    slug: 'framed-botanical-prints',
    name: 'Framed Botanical Prints',
    description:
      'A set of three framed botanical prints in light wood frames. Ready to hang.',
    category: 'Decor',
    style: 'Traditional',
    price: 16500,
    sellerName: 'Clay Studio Galle',
    image: '1787507136009-19ae8d98d867',
  },
  {
    slug: 'linen-bed-set',
    name: 'Washed Linen Bed Set',
    description:
      'A duvet cover and pillowcases in stonewashed linen that softens with every wash.',
    category: 'Bedroom',
    style: 'Minimalist',
    price: 29500,
    sellerName: 'Loom & Thread',
    image: '1606855637183-ea2a00b6f15f',
  },
  {
    slug: 'walnut-bedside-table',
    name: 'Walnut Bedside Table',
    description:
      'A compact bedside table in walnut with one deep drawer and an open shelf for books.',
    category: 'Bedroom',
    style: 'Minimalist',
    price: 31500,
    sellerName: 'Heritage Woodworks',
    image: '1771287490579-afd6e8d3c09a',
  },
  {
    slug: 'arched-leaning-mirror',
    name: 'Arched Leaning Mirror',
    description:
      'A tall arched mirror in a slim white frame. Leans against a wall, no drilling needed.',
    category: 'Decor',
    style: 'Contemporary',
    price: 24500,
    sellerName: 'Forge & Grain',
    image: '1520624197313-3fa687a6add5',
  },
  {
    slug: 'outdoor-lounge-chair',
    name: 'Outdoor Lounge Chair',
    description:
      'A reclining garden lounge chair in a weather-resistant white frame, with a padded olive cushion.',
    category: 'Seating',
    style: 'Tropical Modern',
    price: 52000,
    sellerName: 'Atelier Colombo',
    image: '1785669756182-2f1c00a20939',
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
