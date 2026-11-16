import type { Prisma } from '@prisma/client';

// Each image is a real Unsplash photo of the item itself (free to use).
const photo = (id: string, width = 1000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const productId = (n: number) =>
  `00000007-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

type Seed = Omit<Prisma.ProductCreateManyInput, 'id' | 'imageUrl' | 'sellerUrl'> & {
  image: string;
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
  {
    slug: 'emerald-velvet-sofa',
    name: 'Emerald Velvet Sofa',
    description:
      'A tailored three-seater in deep green velvet on slim walnut legs. The firm seat keeps its shape for years.',
    category: 'Seating',
    style: 'Contemporary',
    price: 168000,
    sellerName: 'Maison Kandy',
    image: '1555041469-a586c61ea9bc',
  },
  {
    slug: 'terracotta-loveseat',
    name: 'Terracotta Loveseat',
    description:
      'A compact two-seater in a warm burnt-orange weave, sized for apartments and reading corners.',
    category: 'Seating',
    style: 'Bohemian',
    price: 96000,
    sellerName: 'Loom & Thread',
    image: '1567016432779-094069958ea5',
  },
  {
    slug: 'tufted-slipper-chair',
    name: 'Tufted Slipper Chair',
    description:
      'A small button-tufted chair in ivory upholstery on turned white legs. Fits beside a dressing table or bed.',
    category: 'Seating',
    style: 'Traditional',
    price: 48500,
    sellerName: 'Maison Kandy',
    image: '1567538096630-e0c55bd6374c',
  },
  {
    slug: 'whitewashed-bar-stool',
    name: 'Whitewashed Bar Stool',
    description:
      'A counter-height stool in whitewashed pine with a sturdy footrest. Light enough to move around the island.',
    category: 'Seating',
    style: 'Scandinavian',
    price: 16500,
    sellerName: 'Heritage Woodworks',
    image: '1503602642458-232111445657',
  },
  {
    slug: 'black-shell-dining-chair',
    name: 'Black Shell Dining Chair',
    description:
      'A moulded black shell seat with a cushioned pad on solid beech legs. Sold individually.',
    category: 'Seating',
    style: 'Minimalist',
    price: 21000,
    sellerName: 'Atelier Colombo',
    image: '1592078615290-033ee584e267',
  },
  {
    slug: 'white-shell-armchair',
    name: 'White Shell Armchair',
    description:
      'A curved white shell armchair that works at a desk or a dining table. Wipe-clean and stackable.',
    category: 'Seating',
    style: 'Minimalist',
    price: 19500,
    sellerName: 'Forge & Grain',
    image: '1519947486511-46149fa0a254',
  },
  {
    slug: 'oatmeal-swivel-chair',
    name: 'Oatmeal Swivel Chair',
    description:
      'A low-back swivel chair in oatmeal fabric on a slim pedestal base, comfortable for long work sessions.',
    category: 'Seating',
    style: 'Contemporary',
    price: 64000,
    sellerName: 'Atelier Colombo',
    image: '1580480055273-228ff5388ef8',
  },
  {
    slug: 'grey-wingback-chair',
    name: 'Grey Wingback Chair',
    description:
      'A modern wingback in soft grey with an exposed beech frame. Tall enough to rest your head while reading.',
    category: 'Seating',
    style: 'Scandinavian',
    price: 72000,
    sellerName: 'Maison Kandy',
    image: '1598300042247-d088f8ab3a91',
  },
  {
    slug: 'tan-leather-sofa',
    name: 'Tan Leather Sofa',
    description:
      'A mid-century three-seater in full-grain tan leather with a channelled back. The leather softens with use.',
    category: 'Seating',
    style: 'Industrial',
    price: 245000,
    sellerName: 'Forge & Grain',
    image: '1540574163026-643ea20ade25',
  },
  {
    slug: 'mocha-modular-sofa',
    name: 'Mocha Modular Sofa',
    description:
      'A low modular sofa in mocha suede-touch fabric. Add or remove modules as your room changes.',
    category: 'Seating',
    style: 'Japandi',
    price: 198000,
    sellerName: 'Atelier Colombo',
    image: '1578500494198-246f612d3b3d',
  },
  {
    slug: 'graphite-floor-lamp',
    name: 'Graphite Floor Lamp',
    description:
      'An adjustable floor lamp with a deep graphite metal shade. Angles over a sofa or reading chair.',
    category: 'Lighting',
    style: 'Industrial',
    price: 28500,
    sellerName: 'Lanka Lumen',
    image: '1507473885765-e6ed057f782c',
  },
  {
    slug: 'dome-pendant-light',
    name: 'Dome Pendant Light',
    description:
      'A white enamel dome pendant on a long fabric cord. Hang one over a desk or several over an island.',
    category: 'Lighting',
    style: 'Scandinavian',
    price: 14500,
    sellerName: 'Lanka Lumen',
    image: '1513506003901-1e6a229e2d15',
  },
  {
    slug: 'brass-task-lamp',
    name: 'Brass Task Lamp',
    description:
      'A slim brass desk lamp with a disc shade that gives warm, glare-free light for evening work.',
    category: 'Lighting',
    style: 'Contemporary',
    price: 18900,
    sellerName: 'Forge & Grain',
    image: '1543198126-a8ad8e47fb22',
  },
  {
    slug: 'grey-bell-pendant',
    name: 'Grey Bell Pendant',
    description:
      'A matt grey bell pendant with a white interior that spreads light evenly over a dining table.',
    category: 'Lighting',
    style: 'Minimalist',
    price: 16800,
    sellerName: 'Lanka Lumen',
    image: '1565814329452-e1efa11c5b89',
  },
  {
    slug: 'rattan-drum-pendant',
    name: 'Rattan Drum Pendant',
    description:
      'A hand-woven rattan pendant that casts patterned light. Made by weavers in the Kandy hills.',
    category: 'Lighting',
    style: 'Bohemian',
    price: 22000,
    sellerName: 'Loom & Thread',
    image: '1618219908412-a29a1bb7b86e',
  },
  {
    slug: 'white-ceramic-vase',
    name: 'White Ceramic Vase',
    description:
      'A smooth, rounded vase in matt white stoneware. Holds a single branch or a loose bunch of greenery.',
    category: 'Decor',
    style: 'Minimalist',
    price: 6800,
    sellerName: 'Clay Studio Galle',
    image: '1581783342308-f792dbdd27c5',
  },
  {
    slug: 'cream-floor-vase',
    name: 'Cream Floor Vase',
    description:
      'A large hand-thrown floor vase in a warm cream glaze, made to stand on its own in a corner.',
    category: 'Decor',
    style: 'Japandi',
    price: 14200,
    sellerName: 'Clay Studio Galle',
    image: '1612196808214-b8e1d6145a8c',
  },
  {
    slug: 'pampas-grass-bundle',
    name: 'Pampas Grass Bundle',
    description:
      'A bundle of dried pampas stems in natural tones. Lasts for years and needs no water.',
    category: 'Decor',
    style: 'Bohemian',
    price: 4500,
    sellerName: 'Loom & Thread',
    image: '1513161455079-7dc1de15ef3e',
  },
  {
    slug: 'round-brass-mirror',
    name: 'Round Brass Mirror',
    description:
      'A large round mirror in a thin brass frame. Brightens a hallway or sits above a sideboard.',
    category: 'Decor',
    style: 'Contemporary',
    price: 26500,
    sellerName: 'Forge & Grain',
    image: '1618220179428-22790b461013',
  },
  {
    slug: 'woven-wool-rug',
    name: 'Woven Wool Rug',
    description:
      'A low-pile wool rug in sand and ivory with a subtle border. Soft underfoot and easy to vacuum.',
    category: 'Rugs',
    style: 'Traditional',
    price: 58000,
    sellerName: 'Loom & Thread',
    image: '1600166898405-da9535204843',
  },
  {
    slug: 'geometric-flatweave-rug',
    name: 'Geometric Flatweave Rug',
    description:
      'A flatweave rug with a black and white geometric pattern that grounds a dark living room.',
    category: 'Rugs',
    style: 'Contemporary',
    price: 44000,
    sellerName: 'Loom & Thread',
    image: '1618219740975-d40978bb7378',
  },
  {
    slug: 'monochrome-check-rug',
    name: 'Monochrome Check Rug',
    description:
      'A cotton rug in a soft grey and white check. Light enough to wash at home.',
    category: 'Rugs',
    style: 'Scandinavian',
    price: 29500,
    sellerName: 'Atelier Colombo',
    image: '1550581190-9c1c48d21d6c',
  },
  {
    slug: 'terracotta-persian-rug',
    name: 'Terracotta Persian-Style Rug',
    description:
      'A traditional medallion pattern in terracotta and rose. Adds warmth to a tiled floor.',
    category: 'Rugs',
    style: 'Bohemian',
    price: 67000,
    sellerName: 'Maison Kandy',
    image: '1617103996702-96ff29b1c467',
  },
  {
    slug: 'oak-wall-cabinet',
    name: 'Oak Wall Cabinet',
    description:
      'A tall open-and-closed cabinet in light oak for books, baskets and display pieces.',
    category: 'Storage',
    style: 'Scandinavian',
    price: 62000,
    sellerName: 'Heritage Woodworks',
    image: '1595428774223-ef52624120d2',
  },
  {
    slug: 'floor-to-ceiling-bookcase',
    name: 'Floor-to-Ceiling Bookcase',
    description:
      'A made-to-measure bookcase in oiled pine. Fitted on site to the height of your wall.',
    category: 'Storage',
    style: 'Traditional',
    price: 135000,
    sellerName: 'Heritage Woodworks',
    image: '1594620302200-9a762244a156',
  },
  {
    slug: 'floating-vanity-unit',
    name: 'Floating Vanity Unit',
    description:
      'A wall-hung bathroom vanity in washed oak with an open shelf for towels.',
    category: 'Storage',
    style: 'Minimalist',
    price: 74000,
    sellerName: 'Atelier Colombo',
    image: '1595515106969-1ce29566ff1c',
  },
  {
    slug: 'floating-media-shelves',
    name: 'Floating Media Shelves',
    description:
      'A set of wall-mounted oak shelves and cubbies that keep a TV wall tidy without a bulky cabinet.',
    category: 'Storage',
    style: 'Contemporary',
    price: 38000,
    sellerName: 'Forge & Grain',
    image: '1594026112284-02bb6f3352fe',
  },
  {
    slug: 'leaning-ladder-shelves',
    name: 'Leaning Ladder Shelves',
    description:
      'Black steel ladder shelves with timber boards. Lean them against a wall for plants and books.',
    category: 'Storage',
    style: 'Industrial',
    price: 31500,
    sellerName: 'Forge & Grain',
    image: '1615875605825-5eb9bb5d52ac',
  },
  {
    slug: 'round-cafe-table',
    name: 'Round Cafe Table',
    description:
      'A white round table on splayed beech legs that seats two to four. Ideal for a kitchen corner.',
    category: 'Tables',
    style: 'Scandinavian',
    price: 34000,
    sellerName: 'Atelier Colombo',
    image: '1533090481720-856c6e3c1fdc',
  },
  {
    slug: 'hairpin-console-table',
    name: 'Hairpin Console Table',
    description:
      'A narrow console in reclaimed timber with two drawers and black hairpin legs.',
    category: 'Tables',
    style: 'Industrial',
    price: 39500,
    sellerName: 'Heritage Woodworks',
    image: '1530018607912-eff2daa1bac4',
  },
  {
    slug: 'walnut-writing-desk',
    name: 'Walnut Writing Desk',
    description:
      'A slim writing desk in walnut with a curved back rail that stops papers sliding off.',
    category: 'Tables',
    style: 'Contemporary',
    price: 56000,
    sellerName: 'Heritage Woodworks',
    image: '1611269154421-4e27233ac5c7',
  },
  {
    slug: 'compact-white-desk',
    name: 'Compact White Desk',
    description:
      'A small white desk with tapered legs that fits a bedroom or hallway nook.',
    category: 'Tables',
    style: 'Minimalist',
    price: 24500,
    sellerName: 'Atelier Colombo',
    image: '1449247709967-d4461a6a6103',
  },
  {
    slug: 'block-coffee-table',
    name: 'Block Coffee Table',
    description:
      'A chunky coffee table carved from a single block of reclaimed wood. No two are the same.',
    category: 'Tables',
    style: 'Japandi',
    price: 68000,
    sellerName: 'Heritage Woodworks',
    image: '1633505899118-4ca6bd143043',
  },
  {
    slug: 'hotel-pillow-pair',
    name: 'Hotel Pillow Pair',
    description:
      'Two medium-firm pillows with a cotton sateen cover and a hypoallergenic fill.',
    category: 'Bedroom',
    style: 'Minimalist',
    price: 9800,
    sellerName: 'Loom & Thread',
    image: '1584100936595-c0654b55a2e2',
  },
  {
    slug: 'storage-daybed',
    name: 'Storage Daybed',
    description:
      'A white daybed with two deep drawers underneath. A sofa by day and a guest bed by night.',
    category: 'Bedroom',
    style: 'Scandinavian',
    price: 118000,
    sellerName: 'Atelier Colombo',
    image: '1575414003591-ece8d0416c7a',
  },
  {
    slug: 'tufted-linen-bed',
    name: 'Tufted Linen Bed',
    description:
      'A queen bed with a tall button-tufted headboard in stone linen. Ships flat and assembles in an hour.',
    category: 'Bedroom',
    style: 'Traditional',
    price: 156000,
    sellerName: 'Maison Kandy',
    image: '1582582621959-48d27397dc69',
  },
  {
    slug: 'carved-teak-nightstand',
    name: 'Carved Teak Nightstand',
    description:
      'A bedside table in teak with a hand-carved drawer front and a lower shelf.',
    category: 'Bedroom',
    style: 'Tropical Modern',
    price: 27500,
    sellerName: 'Heritage Woodworks',
    image: '1617098474202-0d0d7f60c56b',
  },
];

export const PRODUCT_SEED: Prisma.ProductCreateManyInput[] = SEEDS.map(
  ({ image, ...rest }, index) => ({
    ...rest,
    id: productId(index + 1),
    imageUrl: photo(image),
    sellerUrl: `https://example.com/shop/${rest.slug}`,
  }),
);
