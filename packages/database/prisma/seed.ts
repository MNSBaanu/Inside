/**
 * Sample data for local development and manual testing.
 *
 * By default every run RESETS all app tables and inserts the same data set, with fixed
 * ids and timestamps relative to "now", so results are predictable. With SEED_MODE=sync
 * nothing is deleted: missing sample rows are added and existing ones are updated, and
 * all other data is left alone. Refuses to run with NODE_ENV=production.
 * Accounts and scenarios are documented in docs/SEED_DATA.md.
 */
import { cloudinaryCredentials, loadEnvFiles, migrateImages } from './cloudinary-images';
import {
  AccountStatus,
  NotificationType,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ProjectStatus,
  ProposalStatus,
  ReportStatus,
  ReportTargetType,
  RequestStatus,
  RequestType,
  Role,
  StageName,
  StageStatus,
  VerificationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PRODUCT_SEED } from './products';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysAgo = (days: number) => new Date(NOW - days * DAY);
const daysFromNow = (days: number) => new Date(NOW + days * DAY);

/** Fixed ids in UUID v4 shape, so seed records can be referenced by id in tests. */
function seedId(group: number, n: number) {
  const hex = (value: number, length: number) =>
    value.toString(16).padStart(length, '0');
  return `${hex(group, 8)}-0000-4000-8000-${hex(n, 12)}`;
}

const SYNC = process.env.SEED_MODE === 'sync';

/** Adds each row, or updates it if a row with that id already exists. */
async function upsertById<T extends { id: string }>(
  upsert: (args: { where: { id: string }; create: T; update: T }) => Promise<unknown>,
  rows: T[],
) {
  for (let start = 0; start < rows.length; start += 10) {
    await Promise.all(
      rows
        .slice(start, start + 10)
        .map((row) => upsert({ where: { id: row.id }, create: row, update: row })),
    );
  }
}

/** Deliverables are unique per stage and version, so match on that rather than the seed id. */
const upsertDeliverable = (args: { create: Prisma.DeliverableUncheckedCreateInput & { version: number } }) => {
  const { id: _id, ...update } = args.create;
  return prisma.deliverable.upsert({
    where: { stageId_version: { stageId: args.create.stageId, version: args.create.version } },
    create: args.create,
    update,
  });
};

/** Gives rows without a natural id a fixed one, so a later run finds the same row. */
const withIds = <T>(group: number, rows: T[], offset = 0) =>
  rows.map((row, index) => ({ ...row, id: seedId(group, offset + index + 1) }));

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Unsplash photos already used by the app; all verified to resolve.
const PHOTOS = {
  scandiLiving: '1586023492125-27b2c045efd7',
  seating: '1560448204-e02f11c3d0e2',
  kitchen: '1556912173-46c336c7fd55',
  coastalBedroom: '1616594039964-ae9021a400a0',
  neutrals: '1618221195710-dd6b41faaea6',
  shelving: '1616486338812-3dadae4b4ace',
  hero: '1600210491892-03d54c0aaf87',
  villa: '1632119580908-ae947d4c7691',
  loft: '1600210491369-e753d80a41f3',
  townhouse: '1633330977020-2bdfb8530cc2',
  retreat: '1688646953306-5ec93eab8c06',
  samples: '1637649228998-6c78a67dfa6c',
  lounge: '1613545325278-f24b0cae1224',
  desk: '1518455027359-f3f8164ba6bd',
  teakKitchen: '1484154218962-a197022b5858',
  readingNook: '1519710164239-da123dc03ef4',
  studyDesk: '1593062096033-9a26b09da705',
  kidsCorner: '1558211583-d26f610c1eb1',
  bohoPlants: '1502672260266-1c1ef2d93688',
  industrialLoft: '1505873242700-f289a29e1e0f',
  tuftedGreyLiving: '1493663284031-b7e3aefcae8e',
  blueSofaLiving: '1484101403633-562f891dc89a',
  navySofaNook: '1513694203232-719a280e022f',
  openPlanLiving: '1560185127-6ed189bf02f4',
  doubleHeightLiving: '1600566753086-00f18fb6b3ea',
  timberWallLounge: '1600607687939-ce8a6c25118c',
  galleryWallLiving: '1600210492486-724fe5c67fb0',
  monochromeLiving: '1600121848594-d8644e57abab',
  fireplaceLibrary: '1615874694520-474822394e73',
  sageLiving: '1616137422495-1e9e46e2aa77',
  coastalSofa: '1505691938895-1758d7feb511',
  rattanPendantLounge: '1615529182904-14819c35db37',
  sageSideboard: '1616046229478-9901c5536a45',
  classicWhiteLiving: '1598928506311-c55ded91a20c',
  softGreyLiving: '1583847268964-b28dc8f51f92',
  tealOpenLiving: '1554995207-c18c203602cb',
  tealGalleryLiving: '1615873968403-89e068629265',
  whiteLinenLiving: '1632829882891-5047ccc421bc',
  nightLoftLounge: '1611048267451-e6ed903d4a38',
  sunsetLoftLounge: '1564078516393-cf04bd966897',
  midcenturyApartment: '1585412727339-54e4bae3bbf9',
  urbanStudioLiving: '1616137148650-4aa14651e02b',
  boucleLiving: '1631679706909-1844bbd07221',
  navyVelvetLiving: '1615971677499-5467cbab01c0',
  cognacSectional: '1616047006789-b7af5afb8c20',
  greyGuestBedroom: '1560185893-a55cbc8c57e8',
  monoBedroom: '1600607687644-c7171b42498f',
  platformBedroom: '1617325247661-675ab4b64ae2',
  orangeBenchBedroom: '1540518614846-7eded433c457',
  cosyNavyBedroom: '1522771739844-6a9f6d5f14af',
  tuftedMasterBedroom: '1505693416388-ac5ce068fe85',
  brightAtticBedroom: '1595526114035-0d45ed16cfbf',
  darkPanelBedroom: '1617104678098-de229db51175',
  playfulBedroom: '1615874959474-d609969a20ed',
  hotelSuite: '1631049307264-da0ec9d70304',
  lineArtBedroom: '1586105251261-72a756497a11',
  rustBedding: '1616627561839-074385245ff6',
  plantFilledBedroom: '1571508601891-ca5e7a713859',
  compactBedroom: '1556020685-ae41abfc9365',
  airyStudioBedroom: '1531835551805-16d864c8d311',
  heritageSuite: '1590490360182-c33d57733427',
  boucleBenchBedroom: '1616486029423-aaa4789e8c9a',
  whiteHeadboardBedroom: '1588046130717-0eb0c9a3ba15',
  whiteOakKitchen: '1560440021-33f9b867899d',
  marbleKitchen: '1556911220-bff31c812dba',
  hexTileKitchen: '1556912172-45b7abe8b7e1',
  greyIslandKitchen: '1565183928294-7063f23ce0f8',
  pendantIslandKitchen: '1507089947368-19c1da9775ae',
  brassTapKitchen: '1565538810643-b5bdb714032a',
  blueGlossKitchen: '1588854337236-6889d631faa8',
  cottageKitchen: '1574739782594-db4ead022697',
  galleyLightsKitchen: '1602028915047-37269d1a73f7',
  greenCabinetKitchen: '1586208958839-06c17cacdf08',
  gardenViewKitchen: '1617228069096-4638a7ffc906',
  railKitchen: '1556185781-a47769abb7ee',
  forestGreenKitchen: '1600489000022-c2086d79f9d4',
  freestandingBath: '1620626011761-996317b8d101',
  plantBathroom: '1552321554-5fefe8c9ef14',
  glassShowerBath: '1584622650111-993a426fbf0a',
  greyStoneBath: '1604709177225-055f99402ea3',
  oakVanityBath: '1600488999585-e4364713b90a',
  marbleWetroom: '1638799869566-b17fa794c4de',
  bayWindowDining: '1560185007-cde436f6a4d0',
  emeraldDining: '1617806118233-18e1de247200',
  walnutDining: '1615066390971-03e4e1c36ddf',
  studioWorkspace: '1524758631624-e2822e304c36',
  greenStudy: '1600494603989-9650cf6ddd3d',
  floatingDesk: '1597072689227-8882273e8f6a',
  balconyNook: '1616593969747-4797dc75033e',
  verandahPorch: '1560184897-ae75f418493e',
  poolTerrace: '1600573472550-8090b5e0745e',
  timberFacade: '1600585154526-990dced4db0d',
  courtyardHouse: '1600566753190-17f0baa2a6c3',
  eveningHouse: '1600585154363-67eb9e2e2099',
  resortPool: '1596178065887-1198b6148b2b',
  gardenLawn: '1594498653385-d5172c532c00',
  forestCabin: '1595521624992-48a59aef95e3',
  timberStair: '1502005229762-cf1b2da7c5d6',
  brightOpenPlan: '1522708323590-d24dbb6b0267',
} as const;
type PhotoKey = keyof typeof PHOTOS;

const photo = (key: PhotoKey, width = 1200) =>
  `https://images.unsplash.com/photo-${PHOTOS[key]}?auto=format&fit=crop&w=${width}&q=80`;
const seedFile = (name: string) => `https://example.com/seed/${name}`;

const STAGES: StageName[] = [
  StageName.PROPOSAL,
  StageName.CONCEPT,
  StageName.DESIGN,
  StageName.REVISION,
  StageName.COMPLETION,
];

/** Splits a total into the five stage fees (10/20/30/15/25%, rounded to LKR 1,000). */
function stageFees(total: number) {
  const shares = [0.1, 0.2, 0.3, 0.15];
  const fees = shares.map((share) => Math.round((total * share) / 1000) * 1000);
  fees.push(total - fees.reduce((sum, fee) => sum + fee, 0));
  return STAGES.map((name, index) => ({ name, fee: fees[index] }));
}

const TABLES = [
  'Announcement',
  'Product',
  'ActivityLog',
  'Block',
  'Report',
  'Verification',
  'Notification',
  'Review',
  'Message',
  'MilestonePayment',
  'Deliverable',
  'ProjectStage',
  'Project',
  'Proposal',
  'ProjectRequest',
  'Brief',
  'Moodboard',
  'Favourite',
  'PortfolioImage',
  'Portfolio',
  'Session',
  'NewsletterSubscriber',
  'User',
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const U = {
  admin: seedId(1, 1),
  moderator: seedId(1, 2),
  nadia: seedId(1, 10),
  sam: seedId(1, 11),
  kasun: seedId(1, 12),
  amaya: seedId(1, 13),
  ishan: seedId(1, 14),
  ravindu: seedId(1, 15),
  ravi: seedId(1, 20),
  ayesha: seedId(1, 21),
  tharushi: seedId(1, 22),
  nimal: seedId(1, 23),
  shenali: seedId(1, 24),
  arjun: seedId(1, 25),
  malsha: seedId(1, 26),
  chaminda: seedId(1, 27),
  dilan: seedId(1, 30),
  hiruni: seedId(1, 31),
  pradeep: seedId(1, 32),
  sachini: seedId(1, 33),
  kavindu: seedId(1, 34),
  nethmi: seedId(1, 35),
  tharindu: seedId(1, 36),
  anjali: seedId(1, 37),
  ruwan: seedId(1, 38),
  imesha: seedId(1, 39),
  lahiru: seedId(1, 40),
  fathima: seedId(1, 41),
  chathura: seedId(1, 42),
  dulani: seedId(1, 43),
  mohamed: seedId(1, 44),
  sanduni: seedId(1, 45),
  asanka: seedId(1, 46),
  priyanka: seedId(1, 47),
  yasas: seedId(1, 48),
  gayani: seedId(1, 49),
  dinuka: seedId(1, 50),
  shalini: seedId(1, 51),
  roshan: seedId(1, 52),
  harsha: seedId(1, 53),
  thilini: seedId(1, 54),
  naveen: seedId(1, 55),
  ishara: seedId(1, 56),
  zainab: seedId(1, 57),
  demoAdmin: seedId(1, 90),
  demoDesigner: seedId(1, 91),
  demoClient: seedId(1, 92),
};
type UserKey = keyof typeof U;

type UserSeed = {
  key: UserKey;
  email: string;
  name: string;
  role: Role;
  activeRole?: Role;
  isVerified?: boolean;
  emailVerified?: boolean;
  status?: AccountStatus;
  isAvailable?: boolean;
  location?: string;
  phone?: string;
  bio?: string;
  joinedDaysAgo: number;
};

const USERS: UserSeed[] = [
  { key: 'admin', email: 'admin@insidesign.me', name: 'Platform Admin', role: Role.ADMIN, joinedDaysAgo: 200 },
  { key: 'moderator', email: 'moderator@insidesign.me', name: 'Dilini Moderator', role: Role.ADMIN, joinedDaysAgo: 150 },

  { key: 'nadia', email: 'client@insidesign.me', name: 'Nadia Client', role: Role.CLIENT, location: 'Colombo', phone: '+94771234567', bio: 'Renovating a two-bedroom apartment.', joinedDaysAgo: 120 },
  { key: 'sam', email: 'client2@insidesign.me', name: 'Sam Client', role: Role.CLIENT, location: 'Negombo', bio: 'Looking for a coastal bedroom redesign.', joinedDaysAgo: 110 },
  { key: 'kasun', email: 'client3@insidesign.me', name: 'Kasun Perera', role: Role.CLIENT, location: 'Kandy', bio: 'Updating a family home one room at a time.', joinedDaysAgo: 95 },
  { key: 'amaya', email: 'client4@insidesign.me', name: 'Amaya Fernando', role: Role.CLIENT, location: 'Galle', bio: 'Restoring a colonial-era townhouse.', joinedDaysAgo: 80 },
  { key: 'ishan', email: 'client5@insidesign.me', name: 'Ishan Jayawardena', role: Role.CLIENT, location: 'Jaffna', emailVerified: false, joinedDaysAgo: 1 },
  { key: 'ravindu', email: 'suspended.client@insidesign.me', name: 'Ravindu Silva', role: Role.CLIENT, status: AccountStatus.SUSPENDED, location: 'Colombo', joinedDaysAgo: 60 },

  { key: 'ravi', email: 'designer@insidesign.me', name: 'Ravi Jayasinghe', role: Role.DESIGNER, isVerified: true, location: 'Kandy', bio: 'Minimalist and Scandinavian interiors, 6 years experience.', joinedDaysAgo: 180 },
  { key: 'ayesha', email: 'designer2@insidesign.me', name: 'Ayesha Designer', role: Role.DESIGNER, emailVerified: false, location: 'Galle', bio: 'Coastal and relaxed interiors for small homes.', joinedDaysAgo: 20 },
  { key: 'tharushi', email: 'designer3@insidesign.me', name: 'Tharushi Wickramasinghe', role: Role.DESIGNER, isVerified: true, location: 'Colombo', bio: 'Tropical modern homes that stay cool without extra air conditioning.', joinedDaysAgo: 170 },
  { key: 'nimal', email: 'designer4@insidesign.me', name: 'Nimal Herath', role: Role.DESIGNER, isVerified: true, isAvailable: false, location: 'Kurunegala', bio: 'Kitchens and joinery. Fully booked until next quarter.', joinedDaysAgo: 160 },
  { key: 'shenali', email: 'designer5@insidesign.me', name: 'Shenali De Silva', role: Role.DESIGNER, location: 'Colombo', bio: 'Japandi and contemporary spaces with natural materials.', joinedDaysAgo: 45 },
  { key: 'arjun', email: 'designer6@insidesign.me', name: 'Arjun Kumar', role: Role.DESIGNER, location: 'Jaffna', bio: 'Recent graduate, building a portfolio.', joinedDaysAgo: 5 },
  { key: 'malsha', email: 'designer7@insidesign.me', name: 'Malsha Gunawardena', role: Role.DESIGNER, activeRole: Role.CLIENT, isVerified: true, location: 'Matara', bio: 'Bohemian and colourful family spaces.', joinedDaysAgo: 140 },
  { key: 'chaminda', email: 'suspended.designer@insidesign.me', name: 'Chaminda Bandara', role: Role.DESIGNER, status: AccountStatus.SUSPENDED, location: 'Negombo', bio: 'Industrial lofts.', joinedDaysAgo: 70 },

  { key: 'dilan', email: 'designer8@insidesign.me', name: 'Dilan Wijesinghe', role: Role.DESIGNER, isVerified: true, location: 'Colombo', bio: 'Contemporary apartments and penthouses with layered lighting.', joinedDaysAgo: 130 },
  { key: 'hiruni', email: 'designer9@insidesign.me', name: 'Hiruni Abeysekara', role: Role.DESIGNER, isVerified: true, location: 'Kandy', bio: 'Scandinavian-inspired homes for the hill country climate.', joinedDaysAgo: 190 },
  { key: 'pradeep', email: 'designer10@insidesign.me', name: 'Pradeep Fernando', role: Role.DESIGNER, isVerified: true, location: 'Negombo', bio: 'Relaxed coastal interiors that stand up to sea air.', joinedDaysAgo: 150 },
  { key: 'sachini', email: 'designer11@insidesign.me', name: 'Sachini Jayasuriya', role: Role.DESIGNER, isVerified: true, location: 'Galle', bio: 'Tropical modern houses built around courtyards and cross-breezes.', joinedDaysAgo: 185 },
  { key: 'kavindu', email: 'designer12@insidesign.me', name: 'Kavindu Ratnayake', role: Role.DESIGNER, isVerified: true, isAvailable: false, location: 'Kurunegala', bio: 'Industrial lofts and conversions. Booked for the next two months.', joinedDaysAgo: 183 },
  { key: 'nethmi', email: 'designer13@insidesign.me', name: 'Nethmi Karunaratne', role: Role.DESIGNER, isVerified: true, location: 'Gampaha', bio: 'Minimalist family homes with plenty of hidden storage.', joinedDaysAgo: 142 },
  { key: 'tharindu', email: 'designer14@insidesign.me', name: 'Tharindu Mendis', role: Role.DESIGNER, isVerified: true, location: 'Matara', bio: 'Traditional and heritage homes, restored with care.', joinedDaysAgo: 195 },
  { key: 'anjali', email: 'designer15@insidesign.me', name: 'Anjali Sivakumar', role: Role.DESIGNER, isVerified: true, location: 'Jaffna', bio: 'Contemporary family spaces with bold colour and good storage.', joinedDaysAgo: 125 },
  { key: 'ruwan', email: 'designer16@insidesign.me', name: 'Ruwan Dissanayake', role: Role.DESIGNER, isVerified: true, location: 'Anuradhapura', bio: 'Classic bedrooms and country kitchens in natural materials.', joinedDaysAgo: 188 },
  { key: 'imesha', email: 'designer17@insidesign.me', name: 'Imesha Peiris', role: Role.DESIGNER, isVerified: true, location: 'Colombo', bio: 'Japandi interiors: low furniture, warm timber, quiet colour.', joinedDaysAgo: 115 },
  { key: 'lahiru', email: 'designer18@insidesign.me', name: 'Lahiru Gamage', role: Role.DESIGNER, isVerified: true, location: 'Nuwara Eliya', bio: 'Cosy Scandinavian cabins and guest rooms for cool evenings.', joinedDaysAgo: 182 },
  { key: 'fathima', email: 'designer19@insidesign.me', name: 'Fathima Rizvi', role: Role.DESIGNER, isVerified: true, location: 'Batticaloa', bio: 'Bohemian spaces full of plants, pattern and rattan.', joinedDaysAgo: 135 },
  { key: 'chathura', email: 'designer20@insidesign.me', name: 'Chathura Weerasinghe', role: Role.DESIGNER, isVerified: true, isAvailable: false, location: 'Kalutara', bio: 'Riverside villas and resort-style outdoor living. Fully booked.', joinedDaysAgo: 192 },
  { key: 'dulani', email: 'designer21@insidesign.me', name: 'Dulani Ekanayake', role: Role.DESIGNER, location: 'Ratnapura', bio: 'Compact bedrooms and studio flats on a budget.', joinedDaysAgo: 12 },
  { key: 'mohamed', email: 'designer22@insidesign.me', name: 'Mohamed Nazeer', role: Role.DESIGNER, isVerified: true, location: 'Trincomalee', bio: 'Bright coastal apartments and bathrooms.', joinedDaysAgo: 186 },
  { key: 'sanduni', email: 'designer23@insidesign.me', name: 'Sanduni Liyanage', role: Role.DESIGNER, isVerified: true, location: 'Kegalle', bio: 'Playful bohemian rooms for kids, teens and families.', joinedDaysAgo: 112 },
  { key: 'asanka', email: 'designer24@insidesign.me', name: 'Asanka Bandara', role: Role.DESIGNER, isVerified: true, location: 'Badulla', bio: 'Moody industrial interiors with dark timber and steel.', joinedDaysAgo: 197 },
  { key: 'priyanka', email: 'designer25@insidesign.me', name: 'Priyanka Navaratnam', role: Role.DESIGNER, location: 'Vavuniya', bio: 'Contemporary kitchens with clever layouts.', joinedDaysAgo: 8 },
  { key: 'yasas', email: 'designer26@insidesign.me', name: 'Yasas Hettiarachchi', role: Role.DESIGNER, isVerified: true, location: 'Hambantota', bio: 'Tropical modern extensions, bathrooms and gardens.', joinedDaysAgo: 181 },
  { key: 'gayani', email: 'designer27@insidesign.me', name: 'Gayani Samarasinghe', role: Role.DESIGNER, isVerified: true, location: 'Matale', bio: 'Japandi bedrooms and entrances with natural textures.', joinedDaysAgo: 189 },

  { key: 'dinuka', email: 'client6@insidesign.me', name: 'Dinuka Alwis', role: Role.CLIENT, location: 'Colombo', joinedDaysAgo: 199 },
  { key: 'shalini', email: 'client7@insidesign.me', name: 'Shalini Ranasinghe', role: Role.CLIENT, location: 'Kandy', joinedDaysAgo: 198 },
  { key: 'roshan', email: 'client8@insidesign.me', name: 'Roshan Peris', role: Role.CLIENT, location: 'Galle', joinedDaysAgo: 197 },
  { key: 'harsha', email: 'client9@insidesign.me', name: 'Harsha Kodikara', role: Role.CLIENT, location: 'Negombo', joinedDaysAgo: 196 },
  { key: 'thilini', email: 'client10@insidesign.me', name: 'Thilini Gunasekara', role: Role.CLIENT, location: 'Matara', joinedDaysAgo: 195 },
  { key: 'naveen', email: 'client11@insidesign.me', name: 'Naveen Rajan', role: Role.CLIENT, location: 'Jaffna', joinedDaysAgo: 194 },
  { key: 'ishara', email: 'client12@insidesign.me', name: 'Ishara Wanigasekara', role: Role.CLIENT, location: 'Kurunegala', joinedDaysAgo: 193 },
  { key: 'zainab', email: 'client13@insidesign.me', name: 'Zainab Farook', role: Role.CLIENT, location: 'Trincomalee', joinedDaysAgo: 192 },
];

const AVATARS: Partial<Record<UserKey, string>> = {
  ravi: '1492562080023-ab3db95bfbce',
  tharushi: '1488426862026-3ee34a7d66df',
  nimal: '1500648767791-00dcc994a43e',
  shenali: '1567532939604-b6b5b0db2604',
  malsha: '1494790108377-be9c29b29330',
  dilan: '1519085360753-af0119f7cbe7',
  hiruni: '1580489944761-15a19d654956',
  pradeep: '1507003211169-0a1dd7228f2d',
  sachini: '1607746882042-944635dfe10e',
  kavindu: '1506794778202-cad84cf45f1d',
  nethmi: '1627161683077-e34782c24d81',
  tharindu: '1619380061814-58f03707f082',
  anjali: '1618835962148-cf177563c6c0',
  ruwan: '1557862921-37829c790f19',
  imesha: '1592621385612-4d7129426394',
  lahiru: '1531427186611-ecfd6d936c79',
  fathima: '1573496359142-b8d87734a5a2',
  chathura: '1595152772835-219674b2a8a6',
  dulani: '1605993439219-9d09d2020fa5',
  mohamed: '1564564321837-a57b7070ac4f',
  sanduni: '1616002411355-49593fd89721',
  asanka: '1590031905470-a1a1feacbb0b',
  priyanka: '1619895862022-09114b41f16f',
  yasas: '1615109398623-88346a601842',
  gayani: '1541101767792-f9b2b1c4f127',
};

const avatarUrl = (key: UserKey) =>
  AVATARS[key]
    ? `https://images.unsplash.com/photo-${AVATARS[key]}?auto=format&fit=facearea&facepad=3&w=256&h=256&q=80`
    : null;

// ---------------------------------------------------------------------------
// Portfolios
// ---------------------------------------------------------------------------

type PortfolioSeed = {
  designer: UserKey;
  title: string;
  description: string;
  style: string;
  roomType: string;
  budget: number | null;
  published?: boolean;
  images: [PhotoKey, string][];
  createdDaysAgo: number;
};

const PORTFOLIOS: PortfolioSeed[] = [
  { designer: 'ravi', title: 'Scandinavian Living Room', description: 'Light oak, a neutral palette and layered lighting.', style: 'Scandinavian', roomType: 'Living Room', budget: 450000, images: [['scandiLiving', 'Main view'], ['seating', 'Seating detail']], createdDaysAgo: 170 },
  { designer: 'ravi', title: 'Minimalist Kitchen Remodel', description: 'Handleless cabinetry with concealed storage.', style: 'Minimalist', roomType: 'Kitchen', budget: 780000, images: [['kitchen', 'Island']], createdDaysAgo: 150 },
  { designer: 'ravi', title: 'Quiet Home Office', description: 'A calm corner for focused work, with built-in shelving.', style: 'Minimalist', roomType: 'Home Office', budget: 220000, images: [['shelving', 'Shelving wall'], ['desk', 'Desk area']], createdDaysAgo: 90 },

  { designer: 'tharushi', title: 'Colombo Loft', description: 'Cross-ventilation, timber screens and a courtyard view.', style: 'Tropical Modern', roomType: 'Living Room', budget: 1200000, images: [['loft', 'Double-height lounge'], ['hero', 'Courtyard edge']], createdDaysAgo: 160 },
  { designer: 'tharushi', title: 'Kalutara Villa Bedroom', description: 'Shaded verandah bedroom with natural fibres.', style: 'Tropical Modern', roomType: 'Bedroom', budget: 650000, images: [['villa', 'Bedroom and verandah']], createdDaysAgo: 120 },
  { designer: 'tharushi', title: 'Open Dining Pavilion', description: 'An open-sided dining space for family gatherings.', style: 'Contemporary', roomType: 'Dining Room', budget: 900000, images: [['lounge', 'Dining pavilion']], createdDaysAgo: 60 },

  { designer: 'nimal', title: 'Family Kitchen in Teak', description: 'Solid teak joinery with a large prep island.', style: 'Traditional', roomType: 'Kitchen', budget: 1500000, images: [['teakKitchen', 'Teak island'], ['samples', 'Material samples']], createdDaysAgo: 150 },
  { designer: 'nimal', title: 'Reading Corner', description: 'Window seat with storage and warm task lighting.', style: 'Contemporary', roomType: 'Living Room', budget: 180000, images: [['readingNook', 'Window seat']], createdDaysAgo: 100 },

  { designer: 'ayesha', title: 'Coastal Bedroom Concept', description: 'Soft blues and rattan accents for a calm sleep space.', style: 'Coastal', roomType: 'Bedroom', budget: 320000, images: [['coastalBedroom', 'Headboard wall']], createdDaysAgo: 15 },

  { designer: 'shenali', title: 'Japandi Apartment', description: 'Low furniture, linen and pale timber.', style: 'Japandi', roomType: 'Living Room', budget: 550000, images: [['retreat', 'Living area'], ['neutrals', 'Material palette']], createdDaysAgo: 40 },
  { designer: 'shenali', title: 'Spa Bathroom', description: 'Terrazzo, warm lighting and a walk-in shower.', style: 'Japandi', roomType: 'Bathroom', budget: 400000, images: [['townhouse', 'Vanity']], createdDaysAgo: 30 },

  { designer: 'arjun', title: 'Student Studio (draft)', description: 'Work in progress for a compact studio flat.', style: 'Minimalist', roomType: 'Bedroom', budget: null, published: false, images: [['studyDesk', 'Study wall']], createdDaysAgo: 3 },

  { designer: 'malsha', title: 'Colourful Kids Room', description: 'Bold colour, bunk beds and plenty of floor space.', style: 'Bohemian', roomType: 'Kids Room', budget: 280000, images: [['kidsCorner', 'Play corner']], createdDaysAgo: 130 },
  { designer: 'malsha', title: 'Boho Balcony Garden', description: 'Planters, floor cushions and string lights.', style: 'Bohemian', roomType: 'Balcony', budget: 150000, images: [['bohoPlants', 'Planters and seating']], createdDaysAgo: 110 },

  { designer: 'chaminda', title: 'Industrial Loft', description: 'Exposed brick and steel shelving.', style: 'Industrial', roomType: 'Living Room', budget: 700000, images: [['industrialLoft', 'Loft']], createdDaysAgo: 65 },

  { designer: 'ravi', title: 'Green Study', description: 'A deep green study with a built-in desk and reading chair.', style: 'Scandinavian', roomType: 'Home Office', budget: 190000, images: [['greenStudy', 'Desk wall']], createdDaysAgo: 70 },
  { designer: 'ravi', title: 'Studio Workspace', description: 'An open studio with soft seating and task lighting.', style: 'Minimalist', roomType: 'Home Office', budget: 260000, images: [['studioWorkspace', 'Work area']], createdDaysAgo: 50 },
  { designer: 'tharushi', title: 'Guest Room with Window Bench', description: 'A bright guest room with an upholstered bench at the bed end.', style: 'Tropical Modern', roomType: 'Bedroom', budget: 340000, images: [['orangeBenchBedroom', 'Bed and bench']], createdDaysAgo: 45 },
  { designer: 'nimal', title: 'Grey Island Kitchen', description: 'A long island with seating for four and soft-close drawers.', style: 'Traditional', roomType: 'Kitchen', budget: 1200000, images: [['greyIslandKitchen', 'Island']], createdDaysAgo: 140 },
  { designer: 'nimal', title: 'Pendant-Lit Kitchen', description: 'Glass pendants over a white island with bar seating.', style: 'Contemporary', roomType: 'Kitchen', budget: 980000, images: [['pendantIslandKitchen', 'Island and pendants']], createdDaysAgo: 80 },
  { designer: 'nimal', title: 'Galley Kitchen Lighting', description: 'Recessed lights and pendants for a long galley kitchen.', style: 'Contemporary', roomType: 'Kitchen', budget: 420000, images: [['galleyLightsKitchen', 'Galley']], createdDaysAgo: 40 },
  { designer: 'ayesha', title: 'Cosy Navy Bedroom', description: 'Navy accents and soft bedside lighting.', style: 'Coastal', roomType: 'Bedroom', budget: 210000, images: [['cosyNavyBedroom', 'Bedside']], createdDaysAgo: 12 },
  { designer: 'ayesha', title: 'Green Cabinet Kitchen', description: 'Sea-green cabinets and a compact cooking zone.', style: 'Coastal', roomType: 'Kitchen', budget: 480000, images: [['greenCabinetKitchen', 'Cooking wall']], createdDaysAgo: 8 },
  { designer: 'shenali', title: 'Marble Wet Room', description: 'A stone-lined wet room with a deep soaking tub.', style: 'Japandi', roomType: 'Bathroom', budget: 450000, images: [['marbleWetroom', 'Tub and vanity']], createdDaysAgo: 20 },
  { designer: 'shenali', title: 'Sage Sideboard Living Room', description: 'A sage wall, a low sideboard and plenty of plants.', style: 'Contemporary', roomType: 'Living Room', budget: 330000, images: [['sageSideboard', 'Sideboard wall']], createdDaysAgo: 15 },
  { designer: 'malsha', title: 'Teal Gallery Living Room', description: 'A teal feature wall framed by a gallery of prints.', style: 'Bohemian', roomType: 'Living Room', budget: 270000, images: [['tealGalleryLiving', 'Gallery wall']], createdDaysAgo: 90 },
  { designer: 'malsha', title: 'Balcony Reading Nook', description: 'Two armchairs, hanging planters and string lights.', style: 'Bohemian', roomType: 'Balcony', budget: 120000, images: [['balconyNook', 'Reading nook']], createdDaysAgo: 60 },

  { designer: 'dilan', title: 'Colombo Penthouse Lounge', description: 'A dark, layered lounge built for evening entertaining.', style: 'Contemporary', roomType: 'Living Room', budget: 1800000, images: [['nightLoftLounge', 'Evening lounge'], ['doubleHeightLiving', 'Double-height living']], createdDaysAgo: 45 },
  { designer: 'dilan', title: 'Marble Island Kitchen', description: 'Carrara-look worktops and integrated appliances.', style: 'Contemporary', roomType: 'Kitchen', budget: 1100000, images: [['marbleKitchen', 'Island']], createdDaysAgo: 35 },
  { designer: 'dilan', title: 'Walnut Dining Room', description: 'A walnut table for eight under a statement light.', style: 'Contemporary', roomType: 'Dining Room', budget: 520000, images: [['walnutDining', 'Dining table']], createdDaysAgo: 25 },
  { designer: 'hiruni', title: 'Hillside Family Lounge', description: 'Pale walls, linen sofas and a warm fireplace corner.', style: 'Scandinavian', roomType: 'Living Room', budget: 480000, images: [['softGreyLiving', 'Living room'], ['classicWhiteLiving', 'Fireplace wall']], createdDaysAgo: 160 },
  { designer: 'hiruni', title: 'Bright Attic Bedroom', description: 'An attic turned into a light-filled bedroom.', style: 'Scandinavian', roomType: 'Bedroom', budget: 300000, images: [['brightAtticBedroom', 'Bedroom']], createdDaysAgo: 120 },
  { designer: 'hiruni', title: 'White Oak Kitchen', description: 'White cabinetry, open shelving and an oak dining bench.', style: 'Scandinavian', roomType: 'Kitchen', budget: 850000, images: [['whiteOakKitchen', 'Kitchen and table']], createdDaysAgo: 80 },
  { designer: 'pradeep', title: 'Lagoon House Living Room', description: 'Soft blues and natural linen near the Negombo lagoon.', style: 'Coastal', roomType: 'Living Room', budget: 420000, images: [['coastalSofa', 'Sofa wall'], ['navySofaNook', 'Reading corner']], createdDaysAgo: 100 },
  { designer: 'pradeep', title: 'Beach Cottage Kitchen', description: 'A small cottage kitchen with a butcher-block worktop.', style: 'Coastal', roomType: 'Kitchen', budget: 600000, images: [['cottageKitchen', 'Kitchen']], createdDaysAgo: 70 },
  { designer: 'pradeep', title: 'Seaside Verandah', description: 'A shaded verandah with wicker seating.', style: 'Coastal', roomType: 'Balcony', budget: 200000, images: [['verandahPorch', 'Verandah']], createdDaysAgo: 40 },
  { designer: 'sachini', title: 'Galle Courtyard Home', description: 'Open living around a planted courtyard.', style: 'Tropical Modern', roomType: 'Living Room', budget: 1600000, images: [['tealOpenLiving', 'Open living'], ['courtyardHouse', 'Courtyard entrance']], createdDaysAgo: 150 },
  { designer: 'sachini', title: 'Poolside Terrace', description: 'A terrace that steps down to the pool.', style: 'Tropical Modern', roomType: 'Balcony', budget: 900000, images: [['poolTerrace', 'Terrace and pool']], createdDaysAgo: 110 },
  { designer: 'sachini', title: 'Garden View Kitchen', description: 'A kitchen built around a full-height garden window.', style: 'Tropical Modern', roomType: 'Kitchen', budget: 750000, images: [['gardenViewKitchen', 'Garden window']], createdDaysAgo: 70 },
  { designer: 'kavindu', title: 'Warehouse Loft Conversion', description: 'Exposed structure, black steel and a big grey sofa.', style: 'Industrial', roomType: 'Living Room', budget: 950000, images: [['urbanStudioLiving', 'Living area']], createdDaysAgo: 150 },
  { designer: 'kavindu', title: 'Concrete and Steel Bathroom', description: 'Micro-cement walls with matt black fittings.', style: 'Industrial', roomType: 'Bathroom', budget: 380000, images: [['greyStoneBath', 'Vanity and bath']], createdDaysAgo: 120 },
  { designer: 'kavindu', title: 'Rail Kitchen', description: 'A compact kitchen with wall rails for every pan.', style: 'Industrial', roomType: 'Kitchen', budget: 520000, images: [['railKitchen', 'Cooking wall']], createdDaysAgo: 90 },
  { designer: 'nethmi', title: 'Minimal Family Living Room', description: 'Light linen sofas and nothing on show that is not needed.', style: 'Minimalist', roomType: 'Living Room', budget: 400000, images: [['whiteLinenLiving', 'Living room'], ['monochromeLiving', 'Lounge']], createdDaysAgo: 65 },
  { designer: 'nethmi', title: 'Monochrome Bedroom', description: 'Black window frames and crisp white bedding.', style: 'Minimalist', roomType: 'Bedroom', budget: 260000, images: [['monoBedroom', 'Bedroom']], createdDaysAgo: 50 },
  { designer: 'nethmi', title: 'Floating Desk Nook', description: 'A wall-hung desk and shelf in a hallway corner.', style: 'Minimalist', roomType: 'Home Office', budget: 120000, images: [['floatingDesk', 'Desk']], createdDaysAgo: 30 },
  { designer: 'tharindu', title: 'Heritage Walauwa Suite', description: 'A restored master suite in an old family walauwa.', style: 'Traditional', roomType: 'Bedroom', budget: 700000, images: [['heritageSuite', 'Suite']], createdDaysAgo: 170 },
  { designer: 'tharindu', title: 'Classic Library Lounge', description: 'Built-in bookcases around a working fireplace.', style: 'Traditional', roomType: 'Living Room', budget: 650000, images: [['fireplaceLibrary', 'Library wall']], createdDaysAgo: 140 },
  { designer: 'tharindu', title: 'Bay Window Dining', description: 'A dining table set into a sunny bay window.', style: 'Traditional', roomType: 'Dining Room', budget: 380000, images: [['bayWindowDining', 'Dining bay']], createdDaysAgo: 100 },
  { designer: 'anjali', title: 'Navy Velvet Living Room', description: 'A navy wall, tan velvet sofa and brass details.', style: 'Contemporary', roomType: 'Living Room', budget: 560000, images: [['navyVelvetLiving', 'Living room']], createdDaysAgo: 40 },
  { designer: 'anjali', title: 'Hotel-Style Master Suite', description: 'A padded headboard wall and warm bedside lamps.', style: 'Contemporary', roomType: 'Bedroom', budget: 620000, images: [['hotelSuite', 'Bed wall'], ['whiteHeadboardBedroom', 'Guest room']], createdDaysAgo: 30 },
  { designer: 'anjali', title: 'Emerald Dining Room', description: 'Emerald chairs around a white table under a hoop light.', style: 'Contemporary', roomType: 'Dining Room', budget: 450000, images: [['emeraldDining', 'Dining table']], createdDaysAgo: 20 },
  { designer: 'ruwan', title: 'Tufted Master Bedroom', description: 'A tufted headboard, bench and carved bedside chests.', style: 'Traditional', roomType: 'Bedroom', budget: 480000, images: [['tuftedMasterBedroom', 'Bed and bench']], createdDaysAgo: 150 },
  { designer: 'ruwan', title: 'Country Kitchen', description: 'Hexagon tiles, a timber island and a range hood.', style: 'Traditional', roomType: 'Kitchen', budget: 900000, images: [['hexTileKitchen', 'Island']], createdDaysAgo: 120 },
  { designer: 'imesha', title: 'Japandi Studio Apartment', description: 'Boucle seating, round mirrors and pale timber.', style: 'Japandi', roomType: 'Living Room', budget: 380000, images: [['boucleLiving', 'Living area'], ['midcenturyApartment', 'Open-plan view']], createdDaysAgo: 28 },
  { designer: 'imesha', title: 'Low Platform Bedroom', description: 'A timber platform bed with linen layers.', style: 'Japandi', roomType: 'Bedroom', budget: 290000, images: [['platformBedroom', 'Bed']], createdDaysAgo: 20 },
  { designer: 'imesha', title: 'Oak Vanity Bathroom', description: 'A warm oak vanity with a vessel basin.', style: 'Japandi', roomType: 'Bathroom', budget: 340000, images: [['oakVanityBath', 'Vanity']], createdDaysAgo: 10 },
  { designer: 'lahiru', title: 'Hill Country Cabin', description: 'A timber cabin with a sage lounge for cool evenings.', style: 'Scandinavian', roomType: 'Living Room', budget: 520000, images: [['sageLiving', 'Lounge'], ['forestCabin', 'Cabin exterior']], createdDaysAgo: 160 },
  { designer: 'lahiru', title: 'Cosy Guest Bedroom', description: 'Grey walls, a patterned rug and a reading chair.', style: 'Scandinavian', roomType: 'Bedroom', budget: 210000, images: [['greyGuestBedroom', 'Bedroom']], createdDaysAgo: 110 },
  { designer: 'fathima', title: 'Rattan and Plants Lounge', description: 'Rattan pendants, pouffes and trailing plants.', style: 'Bohemian', roomType: 'Living Room', budget: 330000, images: [['rattanPendantLounge', 'Lounge']], createdDaysAgo: 55 },
  { designer: 'fathima', title: 'Plant-Filled Bedroom', description: 'A green, airy bedroom with framed botanicals.', style: 'Bohemian', roomType: 'Bedroom', budget: 240000, images: [['plantFilledBedroom', 'Bedroom']], createdDaysAgo: 40 },
  { designer: 'fathima', title: 'Gallery Wall Living Room', description: 'A leather sofa below a grid of family photos.', style: 'Bohemian', roomType: 'Living Room', budget: 290000, images: [['galleryWallLiving', 'Gallery wall'], ['openPlanLiving', 'Open plan']], createdDaysAgo: 25 },
  { designer: 'chathura', title: 'Riverside Villa', description: 'A timber-clad villa with a warm, panelled lounge.', style: 'Tropical Modern', roomType: 'Living Room', budget: 2200000, images: [['timberWallLounge', 'Lounge'], ['timberFacade', 'Villa facade']], createdDaysAgo: 170 },
  { designer: 'chathura', title: 'Resort-Style Pool Deck', description: 'Palms, planters and a long reflecting pool.', style: 'Tropical Modern', roomType: 'Balcony', budget: 1400000, images: [['resortPool', 'Pool deck']], createdDaysAgo: 140 },
  { designer: 'dulani', title: 'Compact City Bedroom', description: 'A small bedroom with a slim dresser and hidden storage.', style: 'Minimalist', roomType: 'Bedroom', budget: 150000, images: [['compactBedroom', 'Bedroom']], createdDaysAgo: 10 },
  { designer: 'dulani', title: 'Airy Studio Flat', description: 'A studio flat with a gallery wall above the bed.', style: 'Minimalist', roomType: 'Bedroom', budget: 180000, images: [['airyStudioBedroom', 'Sleeping area']], createdDaysAgo: 6 },
  { designer: 'mohamed', title: 'Bay View Apartment', description: 'A pale blue sofa and soft light from the bay.', style: 'Coastal', roomType: 'Living Room', budget: 410000, images: [['blueSofaLiving', 'Living room'], ['tuftedGreyLiving', 'Lounge']], createdDaysAgo: 150 },
  { designer: 'mohamed', title: 'Glass Shower Bathroom', description: 'A walk-in glass shower and a long vanity.', style: 'Coastal', roomType: 'Bathroom', budget: 300000, images: [['glassShowerBath', 'Shower and vanity']], createdDaysAgo: 100 },
  { designer: 'sanduni', title: 'Teen Bedroom Refresh', description: 'Prints, pendants and plants for a growing teenager.', style: 'Bohemian', roomType: 'Kids Room', budget: 190000, images: [['playfulBedroom', 'Bedroom']], createdDaysAgo: 18 },
  { designer: 'sanduni', title: 'Cognac Sectional Living Room', description: 'A cognac sectional with an arched mirror and plants.', style: 'Bohemian', roomType: 'Living Room', budget: 360000, images: [['cognacSectional', 'Living room']], createdDaysAgo: 14 },
  { designer: 'sanduni', title: 'Rust Linen Bedroom', description: 'Rust linen, a rattan side table and soft grey walls.', style: 'Bohemian', roomType: 'Bedroom', budget: 170000, images: [['rustBedding', 'Bed']], createdDaysAgo: 9 },
  { designer: 'asanka', title: 'Dark Panelled Bedroom', description: 'Charcoal panelling with a view onto the garden.', style: 'Industrial', roomType: 'Bedroom', budget: 440000, images: [['darkPanelBedroom', 'Bedroom']], createdDaysAgo: 170 },
  { designer: 'asanka', title: 'Blue Gloss Kitchen', description: 'High-gloss blue cabinets and a marble island.', style: 'Industrial', roomType: 'Kitchen', budget: 780000, images: [['blueGlossKitchen', 'Kitchen']], createdDaysAgo: 140 },
  { designer: 'asanka', title: 'Sunset Loft Lounge', description: 'A double-height lounge facing the hills.', style: 'Industrial', roomType: 'Living Room', budget: 600000, images: [['sunsetLoftLounge', 'Lounge']], createdDaysAgo: 110 },
  { designer: 'priyanka', title: 'Brass Tap Kitchen', description: 'Warm grey cabinets with brass taps and handles.', style: 'Contemporary', roomType: 'Kitchen', budget: 480000, images: [['brassTapKitchen', 'Sink run']], createdDaysAgo: 7 },
  { designer: 'priyanka', title: 'Forest Green Kitchen', description: 'Deep green cabinets and open oak shelves.', style: 'Contemporary', roomType: 'Kitchen', budget: 560000, images: [['forestGreenKitchen', 'Kitchen']], createdDaysAgo: 5 },
  { designer: 'yasas', title: 'Rear House Extension', description: 'A glazed extension that opens the house to the garden.', style: 'Tropical Modern', roomType: 'Living Room', budget: 1300000, images: [['brightOpenPlan', 'Open-plan living'], ['eveningHouse', 'Extension at dusk']], createdDaysAgo: 160 },
  { designer: 'yasas', title: 'Freestanding Bath Retreat', description: 'A freestanding bath beside a planted window.', style: 'Tropical Modern', roomType: 'Bathroom', budget: 520000, images: [['freestandingBath', 'Bath'], ['plantBathroom', 'Basin and greenery']], createdDaysAgo: 110 },
  { designer: 'yasas', title: 'Garden Terrace Landscaping', description: 'Lawn, borders and a terrace for outdoor dining.', style: 'Tropical Modern', roomType: 'Balcony', budget: 350000, images: [['gardenLawn', 'Garden']], createdDaysAgo: 90 },
  { designer: 'gayani', title: 'Line Art Bedroom', description: 'Line drawings, a low bed and warm wall lights.', style: 'Japandi', roomType: 'Bedroom', budget: 230000, images: [['lineArtBedroom', 'Bed wall']], createdDaysAgo: 150 },
  { designer: 'gayani', title: 'Timber Staircase Hall', description: 'An open timber stair with glass balustrades.', style: 'Japandi', roomType: 'Living Room', budget: 410000, images: [['timberStair', 'Staircase']], createdDaysAgo: 120 },
  { designer: 'gayani', title: 'Upholstered Bench Bedroom', description: 'A soft bench, pale linen and a gallery of small prints.', style: 'Japandi', roomType: 'Bedroom', budget: 260000, images: [['boucleBenchBedroom', 'Bedroom']], createdDaysAgo: 80 },
];

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

type ProjectPlan = {
  n: number;
  title: string;
  client: UserKey;
  designer: UserKey;
  total: number;
  timeline: string;
  scope: string;
  startedDaysAgo: number;
  stages: StageStatus[];
  status?: ProjectStatus;
  rejection?: { reason: string; revised: boolean };
  pausedBy?: UserKey;
  cancelled?: { by: UserKey; reason: string };
};

const A = StageStatus.APPROVED;
const S = StageStatus.SUBMITTED;
const I = StageStatus.IN_PROGRESS;
const R = StageStatus.REJECTED;
const P = StageStatus.PENDING;

// Completed projects that exist to give the wider designer pool genuine reviews.
const REVIEWED: { n: number; designer: UserKey; client: UserKey; title: string; total: number; started: number; rating: number; comment: string }[] = [
  { n: 40, designer: 'dilan', client: 'dinuka', title: 'Penthouse living room', total: 1500000, started: 120, rating: 5, comment: 'Dilan understood exactly how we entertain. The lighting plan alone was worth it.' },
  { n: 41, designer: 'dilan', client: 'shalini', title: 'Kitchen and dining refresh', total: 900000, started: 110, rating: 4, comment: 'Great design and clear drawings. Sourcing took a little longer than planned.' },
  { n: 42, designer: 'hiruni', client: 'shalini', title: 'Hillside bungalow living room', total: 450000, started: 140, rating: 5, comment: 'Calm, bright and practical. Our family uses the room far more now.' },
  { n: 43, designer: 'hiruni', client: 'roshan', title: 'Attic bedroom conversion', total: 300000, started: 100, rating: 5, comment: 'Turned a dusty attic into the nicest room in the house.' },
  { n: 44, designer: 'pradeep', client: 'harsha', title: 'Beach house refresh', total: 500000, started: 110, rating: 4, comment: 'Relaxed coastal feel without the cliches. Good value.' },
  { n: 45, designer: 'pradeep', client: 'zainab', title: 'Seaside verandah', total: 180000, started: 100, rating: 5, comment: 'The verandah is now where we spend every evening.' },
  { n: 46, designer: 'sachini', client: 'roshan', title: 'Courtyard home in Galle', total: 1500000, started: 170, rating: 5, comment: 'Sachini kept the house cool and full of light. Highly recommend.' },
  { n: 47, designer: 'sachini', client: 'thilini', title: 'Poolside terrace', total: 850000, started: 120, rating: 4, comment: 'Beautiful result. A few snags at handover, fixed quickly.' },
  { n: 48, designer: 'sachini', client: 'dinuka', title: 'Garden kitchen', total: 700000, started: 100, rating: 5, comment: 'Lovely kitchen that opens straight onto the garden.' },
  { n: 49, designer: 'kavindu', client: 'ishara', title: 'Warehouse loft', total: 900000, started: 160, rating: 4, comment: 'Bold industrial look done tastefully. Replies could be faster.' },
  { n: 50, designer: 'kavindu', client: 'harsha', title: 'Concrete bathroom', total: 350000, started: 130, rating: 5, comment: 'Precise and tidy work. The bathroom looks like a hotel.' },
  { n: 51, designer: 'nethmi', client: 'dinuka', title: 'Minimal family living room', total: 380000, started: 125, rating: 5, comment: 'Less clutter, more space, and every item has a place.' },
  { n: 52, designer: 'nethmi', client: 'ishara', title: 'Home office nook', total: 110000, started: 115, rating: 4, comment: 'Clever use of a tiny corner. Would have liked one more revision.' },
  { n: 53, designer: 'tharindu', client: 'thilini', title: 'Walauwa master suite', total: 650000, started: 180, rating: 5, comment: 'Respectful of the old house and still comfortable for modern life.' },
  { n: 54, designer: 'tharindu', client: 'roshan', title: 'Library lounge', total: 600000, started: 150, rating: 4, comment: 'Handsome room. The joinery was excellent.' },
  { n: 55, designer: 'anjali', client: 'naveen', title: 'Jaffna family home', total: 550000, started: 110, rating: 5, comment: 'Anjali listened carefully and delivered on time and on budget.' },
  { n: 56, designer: 'ruwan', client: 'shalini', title: 'Traditional master bedroom', total: 450000, started: 160, rating: 3, comment: 'Good design, but the project ran three weeks over.' },
  { n: 57, designer: 'ruwan', client: 'ishara', title: 'Country kitchen', total: 850000, started: 130, rating: 4, comment: 'Solid traditional kitchen. Happy with the materials.' },
  { n: 58, designer: 'imesha', client: 'dinuka', title: 'Japandi studio', total: 350000, started: 105, rating: 5, comment: 'Simple, warm and quiet. Exactly what we asked for.' },
  { n: 59, designer: 'lahiru', client: 'thilini', title: 'Hill country cabin', total: 500000, started: 170, rating: 5, comment: 'Cosy and well thought out for the cold evenings.' },
  { n: 60, designer: 'lahiru', client: 'naveen', title: 'Guest bedroom', total: 200000, started: 120, rating: 4, comment: 'Nice, simple guest room. Quick turnaround.' },
  { n: 61, designer: 'fathima', client: 'zainab', title: 'Boho living room', total: 300000, started: 120, rating: 5, comment: 'Colourful without being chaotic. Our friends keep asking who designed it.' },
  { n: 62, designer: 'fathima', client: 'naveen', title: 'Plant-filled bedroom', total: 220000, started: 105, rating: 4, comment: 'Lovely room, though some plants were hard to source.' },
  { n: 63, designer: 'chathura', client: 'roshan', title: 'Riverside villa', total: 2000000, started: 185, rating: 5, comment: 'An outstanding villa. Every detail was considered.' },
  { n: 64, designer: 'chathura', client: 'harsha', title: 'Resort pool deck', total: 1300000, started: 150, rating: 5, comment: 'Feels like a resort at home.' },
  { n: 65, designer: 'mohamed', client: 'zainab', title: 'Bay view apartment', total: 400000, started: 140, rating: 4, comment: 'Bright apartment with great storage ideas.' },
  { n: 66, designer: 'sanduni', client: 'shalini', title: 'Teen bedroom refresh', total: 180000, started: 100, rating: 5, comment: 'Our daughter loves it. Sanduni involved her in every choice.' },
  { n: 67, designer: 'asanka', client: 'ishara', title: 'Dark panelled bedroom', total: 420000, started: 180, rating: 4, comment: 'Moody and dramatic, just as planned.' },
  { n: 68, designer: 'asanka', client: 'thilini', title: 'Loft lounge', total: 580000, started: 150, rating: 3, comment: 'Good look, but the budget grew during the build.' },
  { n: 69, designer: 'yasas', client: 'naveen', title: 'House extension', total: 1200000, started: 170, rating: 5, comment: 'Yasas made the extension feel like it was always part of the house.' },
  { n: 70, designer: 'yasas', client: 'harsha', title: 'Bathroom retreat', total: 500000, started: 120, rating: 4, comment: 'Beautiful bathroom with lots of natural light.' },
  { n: 71, designer: 'gayani', client: 'dinuka', title: 'Japandi bedroom', total: 220000, started: 160, rating: 5, comment: 'Restful and beautifully detailed.' },
  { n: 72, designer: 'gayani', client: 'zainab', title: 'Entrance hall and stair', total: 400000, started: 130, rating: 4, comment: 'Elegant result. Timing was well managed.' },
];

const PROJECTS: ProjectPlan[] = [
  { n: 1, title: 'Living room and kitchen refresh', client: 'nadia', designer: 'ravi', total: 700000, timeline: '12 weeks', scope: 'Concept boards, 3D visuals, a furniture schedule and site supervision for two rooms.', startedDaysAgo: 24, stages: [A, S, P, P, P] },
  { n: 2, title: 'Master bedroom makeover', client: 'nadia', designer: 'tharushi', total: 600000, timeline: '10 weeks', scope: 'Bedroom layout, lighting plan, joinery and styling.', startedDaysAgo: 40, stages: [A, A, R, P, P], rejection: { reason: 'The wardrobe blocks the window light. Could you move it to the east wall and lighten the finish?', revised: true } },
  { n: 3, title: 'Studio nook makeover', client: 'sam', designer: 'ravi', total: 180000, timeline: '4 weeks', scope: 'Layout plan and furniture sourcing for a work nook.', startedDaysAgo: 60, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 4, title: 'Beach house dining area', client: 'sam', designer: 'tharushi', total: 450000, timeline: '8 weeks', scope: 'Dining area redesign with outdoor flow.', startedDaysAgo: 75, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 5, title: 'Family kitchen upgrade', client: 'kasun', designer: 'nimal', total: 1400000, timeline: '16 weeks', scope: 'Full kitchen redesign with custom teak joinery.', startedDaysAgo: 35, stages: [A, A, I, P, P], status: ProjectStatus.ON_HOLD, pausedBy: 'kasun' },
  { n: 6, title: 'Home office conversion', client: 'amaya', designer: 'ravi', total: 250000, timeline: '5 weeks', scope: 'Convert a spare room into a home office.', startedDaysAgo: 30, stages: [A, I, P, P, P], status: ProjectStatus.CANCELLED, cancelled: { by: 'amaya', reason: 'We are moving house sooner than planned, so the room will not be needed.' } },
  { n: 7, title: 'Kids room refresh', client: 'malsha', designer: 'tharushi', total: 300000, timeline: '6 weeks', scope: 'Brighter kids room with more storage and a study desk.', startedDaysAgo: 2, stages: [I, P, P, P, P] },
  { n: 8, title: 'Apartment balcony garden', client: 'kasun', designer: 'ravi', total: 150000, timeline: '3 weeks', scope: 'Planting plan and seating for a small balcony.', startedDaysAgo: 90, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 9, title: 'Reading corner', client: 'nadia', designer: 'nimal', total: 180000, timeline: '4 weeks', scope: 'Window seat with storage and lighting.', startedDaysAgo: 100, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  ...REVIEWED.map((r) => ({ n: r.n, title: r.title, client: r.client, designer: r.designer, total: r.total, timeline: '6 weeks', scope: `${r.title}: concept, drawings, sourcing and site visits.`, startedDaysAgo: r.started, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED })),
];

const projectId = (n: number) => seedId(10, n);

// Demo-day accounts with real inboxes. Added only when the DEMO_* variables are set.
const DEMO_PROJECTS: ProjectPlan[] = [
  { n: 100, title: 'Open-plan apartment refresh', client: 'demoClient', designer: 'demoDesigner', total: 850000, timeline: '12 weeks', scope: 'Concept boards, 3D visuals, a furniture schedule and site visits for the living, dining and kitchen area.', startedDaysAgo: 28, stages: [A, S, P, P, P] },
  { n: 101, title: 'Calm master bedroom', client: 'demoClient', designer: 'demoDesigner', total: 420000, timeline: '6 weeks', scope: 'Bedroom layout, wardrobe design, lighting and styling.', startedDaysAgo: 110, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 102, title: 'Garden-facing home office', client: 'demoClient', designer: 'tharushi', total: 300000, timeline: '6 weeks', scope: 'Desk wall, storage and a reading corner looking onto the garden.', startedDaysAgo: 45, stages: [A, A, R, P, P], rejection: { reason: 'The desk faces away from the window. Could we turn it so I can see the garden?', revised: true } },
  { n: 103, title: 'Coastal guest bedroom', client: 'sam', designer: 'demoDesigner', total: 260000, timeline: '5 weeks', scope: 'Guest bedroom concept, soft furnishings and a sourcing list.', startedDaysAgo: 18, stages: [A, I, P, P, P] },
  { n: 104, title: 'Family kitchen with island', client: 'kasun', designer: 'demoDesigner', total: 950000, timeline: '14 weeks', scope: 'Kitchen layout, joinery drawings and an appliance schedule.', startedDaysAgo: 150, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
];

async function seedProject(plan: ProjectPlan) {
  const client = U[plan.client];
  const designer = U[plan.designer];
  const fees = stageFees(plan.total);
  const status = plan.status ?? ProjectStatus.ACTIVE;
  const startedAt = daysAgo(plan.startedDaysAgo);
  const step = Math.max(1, Math.floor(plan.startedDaysAgo / 6));
  const at = (stageIndex: number, offset = 0) =>
    daysAgo(Math.max(0, plan.startedDaysAgo - (stageIndex + 1) * step + offset));

  const requestId = seedId(8, plan.n);
  const proposalId = seedId(9, plan.n);
  const id = projectId(plan.n);

  await upsertById(
    (args) => prisma.projectRequest.upsert(args),
    [
      {
        id: requestId,
        clientId: client,
        designerId: designer,
        title: plan.title,
        description: plan.scope,
        timeline: plan.timeline,
        type: RequestType.DIRECT,
        status: RequestStatus.ACCEPTED,
        budget: plan.total,
        createdAt: daysAgo(plan.startedDaysAgo + 5),
      },
    ],
  );
  await upsertById(
    (args) => prisma.proposal.upsert(args),
    [
      {
        id: proposalId,
        requestId,
        designerId: designer,
        scope: plan.scope,
        timeline: plan.timeline,
        stageFees: fees,
        totalAmount: plan.total,
        status: ProposalStatus.ACCEPTED,
        submittedAt: daysAgo(plan.startedDaysAgo + 3),
      },
    ],
  );

  const currentIndex = plan.stages.findIndex((s) => s !== StageStatus.APPROVED);
  const completed = status === ProjectStatus.COMPLETED;
  await upsertById(
    (args) => prisma.project.upsert(args),
    [
      {
        id,
        proposalId,
        clientId: client,
        designerId: designer,
        title: plan.title,
        currentStage: STAGES[currentIndex === -1 ? STAGES.length - 1 : currentIndex],
        status,
        startedAt,
        completedAt: completed ? at(STAGES.length - 1) : null,
        createdAt: startedAt,
      },
    ],
  );

  const logs: Prisma.ActivityLogCreateManyInput[] = [
    { projectId: id, userId: client, action: 'PROPOSAL_ACCEPTED', metadata: { proposalId, requestId }, createdAt: startedAt },
  ];

  for (const [index, stageStatus] of plan.stages.entries()) {
    const stageId = seedId(11, plan.n * 10 + index + 1);
    const name = STAGES[index];
    const touched = stageStatus !== StageStatus.PENDING;
    const reviewed =
      stageStatus === StageStatus.APPROVED || stageStatus === StageStatus.REJECTED;
    const submitted = reviewed || stageStatus === StageStatus.SUBMITTED;

    await upsertById(
      (args) => prisma.projectStage.upsert(args),
      [
        {
          id: stageId,
          projectId: id,
          stageOrder: index + 1,
          name,
          status: stageStatus,
          fee: fees[index].fee,
          dueDate: new Date(startedAt.getTime() + (index + 1) * 14 * DAY),
          submittedAt: submitted ? at(index, 1) : null,
          approvedAt: stageStatus === StageStatus.APPROVED ? at(index) : null,
        },
      ],
    );

    if (index === 0 && touched) {
      logs.push({ projectId: id, userId: designer, action: 'STAGE_STARTED', metadata: { stageId, name }, createdAt: startedAt });
    }

    if (submitted) {
      const isImage = index % 2 === 1;
      await upsertById(
        upsertDeliverable,
        [
          {
            id: seedId(14, plan.n * 100 + (index + 1) * 10 + 1),
            stageId,
            version: 1,
            fileUrl: isImage ? photo('samples') : seedFile(`${name.toLowerCase()}-v1.pdf`),
            fileName: `${name.toLowerCase()}-v1.${isImage ? 'jpg' : 'pdf'}`,
            notes: `${name.charAt(0)}${name.slice(1).toLowerCase()} stage deliverable.`,
            feedback: stageStatus === StageStatus.REJECTED ? plan.rejection?.reason : null,
            uploadedAt: at(index, 2),
          },
        ],
      );
      logs.push(
        { projectId: id, userId: designer, action: 'DELIVERABLE_UPLOADED', metadata: { stageId, version: 1 }, createdAt: at(index, 2) },
        { projectId: id, userId: designer, action: 'STAGE_SUBMITTED', metadata: { stageId, name, version: 1 }, createdAt: at(index, 1) },
      );
    }

    if (stageStatus === StageStatus.REJECTED && plan.rejection) {
      logs.push({ projectId: id, userId: client, action: 'STAGE_REJECTED', metadata: { stageId, name, reason: plan.rejection.reason }, createdAt: at(index) });
      if (plan.rejection.revised) {
        await upsertById(
          upsertDeliverable,
          [
            {
              id: seedId(14, plan.n * 100 + (index + 1) * 10 + 2),
              stageId,
              version: 2,
              fileUrl: seedFile(`${name.toLowerCase()}-v2.pdf`),
              fileName: `${name.toLowerCase()}-v2.pdf`,
              notes: 'Revised after client feedback.',
              uploadedAt: daysAgo(1),
            },
          ],
        );
        logs.push({ projectId: id, userId: designer, action: 'DELIVERABLE_UPLOADED', metadata: { stageId, version: 2 }, createdAt: daysAgo(1) });
      }
    }

    if (stageStatus === StageStatus.APPROVED) {
      logs.push({ projectId: id, userId: client, action: 'STAGE_APPROVED', metadata: { stageId, name }, createdAt: at(index) });
    }

    const released = stageStatus === StageStatus.APPROVED;
    const paid = touched;
    await upsertById(
      (args) => prisma.milestonePayment.upsert(args),
      [
        {
          id: seedId(15, plan.n * 10 + index + 1),
          projectId: id,
          stageId,
          amount: fees[index].fee,
          status: released ? PaymentStatus.RELEASED : paid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paidAt: paid ? at(index, 3) : null,
          releasedAt: released ? at(index) : null,
          createdAt: startedAt,
        },
      ],
    );
    if (paid) {
      logs.push({ projectId: id, userId: client, action: 'PAYMENT_PAID', metadata: { amount: fees[index].fee }, createdAt: at(index, 3) });
    }
    if (released) {
      logs.push({ projectId: id, userId: client, action: 'PAYMENT_RELEASED', metadata: { amount: fees[index].fee }, createdAt: at(index) });
    }
  }

  if (completed) {
    logs.push({ projectId: id, userId: client, action: 'PROJECT_COMPLETED', createdAt: at(STAGES.length - 1) });
  }
  if (plan.pausedBy) {
    logs.push({ projectId: id, userId: U[plan.pausedBy], action: 'PROJECT_ON_HOLD', createdAt: daysAgo(3) });
  }
  if (plan.cancelled) {
    logs.push({ projectId: id, userId: U[plan.cancelled.by], action: 'PROJECT_CANCELLED', metadata: { reason: plan.cancelled.reason }, createdAt: daysAgo(4) });
  }

  await upsertById(
    (args) => prisma.activityLog.upsert(args),
    withIds(16, logs, plan.n * 100),
  );
}

type Line = {
  from: 'client' | 'designer';
  text: string;
  daysAgo: number;
  attachment?: { url: string; type: string };
  unread?: boolean;
};

async function seedThread(n: number, lines: Line[]) {
  const plan = [...PROJECTS, ...DEMO_PROJECTS].find((p) => p.n === n);
  if (!plan) throw new Error(`No project ${n}`);
  const people = { client: U[plan.client], designer: U[plan.designer] };
  await upsertById(
    (args) => prisma.message.upsert(args),
    withIds(17, lines.map((line) => {
      const sender = people[line.from];
      const receiver = line.from === 'client' ? people.designer : people.client;
      return {
        projectId: projectId(n),
        senderId: sender,
        receiverId: receiver,
        content: line.text,
        attachmentUrl: line.attachment?.url ?? null,
        attachmentType: line.attachment?.type ?? null,
        isRead: !line.unread,
        readAt: line.unread ? null : daysAgo(Math.max(0, line.daysAgo - 0.1)),
        sentAt: daysAgo(line.daysAgo),
      };
    }), n * 100),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset and seed a production database.');
  }

  const [{ db }] = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
  if (SYNC) {
    console.log(`Adding and updating sample data in "${db}"...`);
  } else {
    console.log(`Resetting and seeding "${db}"...`);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} CASCADE`,
    );
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Users
  await upsertById(
    (args) => prisma.user.upsert(args),
    USERS.map((user) => ({
      id: U[user.key],
      email: user.email,
      passwordHash,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole ?? user.role,
      hasClientAccount: user.role === Role.DESIGNER && user.activeRole === Role.CLIENT,
      isVerified: user.isVerified ?? false,
      emailVerified: user.emailVerified === false ? null : daysAgo(user.joinedDaysAgo),
      status: user.status ?? AccountStatus.ACTIVE,
      isOwner: user.key === 'admin',
      isAvailable: user.isAvailable ?? true,
      location: user.location ?? null,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      avatarUrl: avatarUrl(user.key),
      createdAt: daysAgo(user.joinedDaysAgo),
    })),
  );

  // One demo refresh session (see docs/SEED_DATA.md).
  const session = {
    userId: U.nadia,
    refreshTokenHash: hashToken('seed-client-refresh'),
    userAgent: 'SeedBrowser/1.0',
    ipAddress: '127.0.0.1',
    expiresAt: daysFromNow(7),
  };
  await prisma.session.upsert({
    where: { refreshTokenHash: session.refreshTokenHash },
    create: session,
    update: session,
  });

  // Portfolios
  for (const [index, item] of PORTFOLIOS.entries()) {
    const data = {
      id: seedId(2, index + 1),
      designerId: U[item.designer],
      title: item.title,
      description: item.description,
      style: item.style,
      roomType: item.roomType,
      budget: item.budget,
      isPublished: item.published ?? true,
      createdAt: daysAgo(item.createdDaysAgo),
    };
    const images = item.images.map(([key, caption], order) => ({
      imageUrl: photo(key),
      caption,
      displayOrder: order,
    }));
    await prisma.portfolio.upsert({
      where: { id: data.id },
      create: { ...data, images: { create: images } },
      update: { ...data, images: { deleteMany: {}, create: images } },
    });
  }

  // Favourites
  const favourites: [UserKey, UserKey][] = [
    ['nadia', 'ravi'],
    ['nadia', 'tharushi'],
    ['sam', 'ravi'],
    ['kasun', 'tharushi'],
    ['kasun', 'nimal'],
    ['amaya', 'shenali'],
    ['malsha', 'tharushi'],
  ];
  for (const data of favourites.map(([client, designer]) => ({ clientId: U[client], designerId: U[designer] }))) {
    await prisma.favourite.upsert({ where: { clientId_designerId: data }, create: data, update: {} });
  }

  // Moodboards and briefs
  const moodboards: { n: number; client: UserKey; name: string; items: [PhotoKey, string][] }[] = [
    { n: 1, client: 'nadia', name: 'Apartment Refresh', items: [['neutrals', 'Warm neutrals'], ['shelving', 'Open shelving'], ['scandiLiving', 'Light oak floor']] },
    { n: 2, client: 'nadia', name: 'Bedroom Calm', items: [['villa', 'Verandah light'], ['coastalBedroom', 'Soft textiles']] },
    { n: 3, client: 'sam', name: 'Coastal Bedroom', items: [['coastalBedroom', 'Soft blue palette']] },
    { n: 4, client: 'kasun', name: 'Japandi Living', items: [['retreat', 'Low furniture'], ['samples', 'Linen and timber']] },
    { n: 5, client: 'amaya', name: 'Townhouse Bathroom', items: [['townhouse', 'Terrazzo']] },
  ];
  for (const board of moodboards) {
    await upsertById(
      (args) => prisma.moodboard.upsert(args),
      [
        {
          id: seedId(3, board.n),
          clientId: U[board.client],
          name: board.name,
          savedItems: board.items.map(([key, note]) => ({ imageUrl: photo(key, 800), note })),
        },
      ],
    );
  }

  const briefs: { n: number; client: UserKey; moodboard?: number; styles: string[]; rooms: string[]; budgetRange: string; description: string }[] = [
    { n: 1, client: 'nadia', moodboard: 1, styles: ['Scandinavian', 'Minimalist'], rooms: ['Living Room', 'Kitchen'], budgetRange: '400000-800000', description: 'Refresh the living room and kitchen with warm neutral tones and better storage.' },
    { n: 2, client: 'nadia', moodboard: 2, styles: ['Tropical Modern'], rooms: ['Bathroom'], budgetRange: 'LKR 150k-250k', description: 'Guest bathroom that feels open and bright.' },
    { n: 3, client: 'sam', moodboard: 3, styles: ['Coastal', 'Scandinavian'], rooms: ['Bedroom'], budgetRange: '250000-400000', description: 'Calm coastal bedroom with better storage and natural light.' },
    { n: 4, client: 'kasun', moodboard: 4, styles: ['Japandi'], rooms: ['Living Room'], budgetRange: '500000-700000', description: 'Quiet, uncluttered living room for a family of four.' },
    { n: 5, client: 'amaya', moodboard: 5, styles: ['Japandi', 'Contemporary'], rooms: ['Bathroom'], budgetRange: '300000-450000', description: 'Spa-like bathroom in a restored townhouse.' },
    { n: 6, client: 'ishan', styles: ['Minimalist'], rooms: ['Living Room', 'Bedroom'], budgetRange: '1,000,000', description: 'First apartment, furnishing from scratch.' },
  ];
  for (const brief of briefs) {
    await upsertById(
      (args) => prisma.brief.upsert(args),
      [
        {
          id: seedId(4, brief.n),
          clientId: U[brief.client],
          moodboardId: brief.moodboard ? seedId(3, brief.moodboard) : null,
          styles: brief.styles,
          rooms: brief.rooms,
          budgetRange: brief.budgetRange,
          description: brief.description,
        },
      ],
    );
  }

  // Projects (each with its accepted request and proposal)
  for (const plan of PROJECTS) {
    await seedProject(plan);
  }

  // Requests that are not (yet) projects, covering every request and proposal status
  const requests: {
    n: number;
    client: UserKey;
    designer?: UserKey;
    brief?: number;
    title: string;
    description: string;
    timeline?: string;
    budget: number;
    type: RequestType;
    status: RequestStatus;
    createdDaysAgo: number;
    proposals?: { designer: UserKey; total: number; timeline: string; scope: string; status: ProposalStatus; daysAgo: number }[];
  }[] = [
    {
      n: 20, client: 'kasun', brief: 4, title: 'Japandi living room', description: 'Open to proposals: a calm living room for a family of four.', timeline: '8 weeks', budget: 600000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 6,
      proposals: [
        { designer: 'ravi', total: 580000, timeline: '8 weeks', scope: 'Layout, furniture plan, lighting and styling.', status: ProposalStatus.PENDING, daysAgo: 5 },
        { designer: 'tharushi', total: 640000, timeline: '10 weeks', scope: 'Full redesign including custom joinery.', status: ProposalStatus.PENDING, daysAgo: 4 },
        { designer: 'shenali', total: 520000, timeline: '7 weeks', scope: 'Japandi concept, sourcing list and on-site styling day.', status: ProposalStatus.PENDING, daysAgo: 3 },
        { designer: 'ayesha', total: 450000, timeline: '6 weeks', scope: 'Styling package with two concepts.', status: ProposalStatus.WITHDRAWN, daysAgo: 4 },
      ],
    },
    {
      n: 21, client: 'sam', brief: 3, title: 'Coastal master bedroom redesign', description: 'Open request, comparing proposals from available designers.', timeline: '6 weeks', budget: 350000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 10,
      proposals: [
        { designer: 'ravi', total: 350000, timeline: '6 weeks', scope: 'Mood concepts, furniture plan and shopping list for one bedroom.', status: ProposalStatus.PENDING, daysAgo: 9 },
        { designer: 'ayesha', total: 320000, timeline: '5 weeks', scope: 'Coastal styling package with two concept options and sourcing support.', status: ProposalStatus.PENDING, daysAgo: 8 },
      ],
    },
    { n: 22, client: 'amaya', brief: 5, title: 'Bathroom spa refresh', description: 'Looking for ideas for a small townhouse bathroom.', timeline: '5 weeks', budget: 400000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 1 },
    {
      n: 23, client: 'nadia', designer: 'tharushi', brief: 2, title: 'Guest bathroom', description: 'Would love your take on a bright guest bathroom.', timeline: '5 weeks', budget: 220000, type: RequestType.DIRECT, status: RequestStatus.PENDING, createdDaysAgo: 4,
      proposals: [{ designer: 'tharushi', total: 210000, timeline: '5 weeks', scope: 'Layout, tiling plan and lighting.', status: ProposalStatus.PENDING, daysAgo: 2 }],
    },
    { n: 24, client: 'kasun', designer: 'ravi', title: 'Dining room lighting plan', description: 'Just the lighting, we are happy with the furniture.', timeline: '3 weeks', budget: 120000, type: RequestType.DIRECT, status: RequestStatus.PENDING, createdDaysAgo: 2 },
    {
      n: 25, client: 'sam', designer: 'shenali', title: 'Entrance hallway', description: 'Narrow hallway that needs storage.', timeline: '4 weeks', budget: 150000, type: RequestType.DIRECT, status: RequestStatus.PENDING, createdDaysAgo: 12,
      proposals: [{ designer: 'shenali', total: 190000, timeline: '4 weeks', scope: 'Hallway storage and lighting.', status: ProposalStatus.REJECTED, daysAgo: 10 }],
    },
    { n: 26, client: 'amaya', designer: 'nimal', title: 'Townhouse kitchen', description: 'Teak kitchen in a restored townhouse.', timeline: '14 weeks', budget: 1300000, type: RequestType.DIRECT, status: RequestStatus.REJECTED, createdDaysAgo: 20 },
    { n: 27, client: 'nadia', title: 'Balcony garden', description: 'Small balcony, more plants and a place to sit.', timeline: '3 weeks', budget: 100000, type: RequestType.OPEN, status: RequestStatus.CANCELLED, createdDaysAgo: 30 },
    {
      n: 28, client: 'amaya', title: 'Dining room lighting', description: 'Pendant lighting for a long dining table.', timeline: '2 weeks', budget: 80000, type: RequestType.OPEN, status: RequestStatus.CLOSED, createdDaysAgo: 25,
      proposals: [{ designer: 'shenali', total: 95000, timeline: '2 weeks', scope: 'Lighting plan and fitting schedule.', status: ProposalStatus.REJECTED, daysAgo: 23 }],
    },
    { n: 29, client: 'malsha', designer: 'nimal', title: 'Pantry shelving', description: 'Floor-to-ceiling pantry shelving.', timeline: '4 weeks', budget: 200000, type: RequestType.DIRECT, status: RequestStatus.PENDING, createdDaysAgo: 3 },

    {
      n: 80, client: 'dinuka', title: 'Two-bedroom apartment makeover', description: 'We have just bought an apartment in Colombo 5 and want it finished before we move in.', timeline: '10 weeks', budget: 900000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 2,
      proposals: [
        { designer: 'dilan', total: 880000, timeline: '10 weeks', scope: 'Full concept, furniture plan, lighting and weekly site visits.', status: ProposalStatus.PENDING, daysAgo: 1 },
        { designer: 'imesha', total: 760000, timeline: '9 weeks', scope: 'Japandi concept for both bedrooms and the living area, with a sourcing list.', status: ProposalStatus.PENDING, daysAgo: 1 },
      ],
    },
    {
      n: 81, client: 'shalini', title: 'Kandy bungalow verandah', description: 'An old verandah that needs seating, shade and lighting.', timeline: '4 weeks', budget: 250000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 5,
      proposals: [{ designer: 'hiruni', total: 240000, timeline: '4 weeks', scope: 'Seating layout, blinds and a lighting plan.', status: ProposalStatus.PENDING, daysAgo: 3 }],
    },
    {
      n: 82, client: 'roshan', title: 'Boutique guesthouse rooms', description: 'Three guest rooms for a small guesthouse near Galle Fort.', timeline: '12 weeks', budget: 1800000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 8,
      proposals: [
        { designer: 'sachini', total: 1750000, timeline: '12 weeks', scope: 'Room concepts, joinery drawings and procurement for three rooms.', status: ProposalStatus.PENDING, daysAgo: 6 },
        { designer: 'tharindu', total: 1650000, timeline: '14 weeks', scope: 'Heritage-led design with restored furniture where possible.', status: ProposalStatus.PENDING, daysAgo: 5 },
      ],
    },
    { n: 83, client: 'harsha', title: 'Kitchen for a beach house', description: 'A hard-wearing kitchen that copes with sea air.', timeline: '8 weeks', budget: 700000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 1 },
    {
      n: 84, client: 'thilini', title: 'Home office for two', description: 'We both work from home and need two desks in one room.', timeline: '5 weeks', budget: 280000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 4,
      proposals: [{ designer: 'nethmi', total: 260000, timeline: '5 weeks', scope: 'Twin desk layout, storage wall and acoustic panels.', status: ProposalStatus.PENDING, daysAgo: 2 }],
    },
    {
      n: 85, client: 'naveen', title: 'Kids room for twins', description: 'A shared bedroom for six-year-old twins with storage and a study corner.', timeline: '6 weeks', budget: 300000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 7,
      proposals: [{ designer: 'sanduni', total: 290000, timeline: '6 weeks', scope: 'Bunk layout, storage, study corner and a colour plan.', status: ProposalStatus.PENDING, daysAgo: 5 }],
    },
    {
      n: 86, client: 'ishara', title: 'Open-plan living and dining', description: 'We are knocking two rooms together and need a plan for the new space.', timeline: '9 weeks', budget: 850000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 9,
      proposals: [{ designer: 'asanka', total: 820000, timeline: '9 weeks', scope: 'Layout, lighting, joinery and a furniture schedule.', status: ProposalStatus.PENDING, daysAgo: 7 }],
    },
    {
      n: 87, client: 'zainab', title: 'Coastal master bedroom', description: 'A bright master bedroom with a view of the bay.', timeline: '6 weeks', budget: 350000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 3,
      proposals: [
        { designer: 'mohamed', total: 330000, timeline: '6 weeks', scope: 'Bedroom concept, wardrobe design and soft furnishings.', status: ProposalStatus.PENDING, daysAgo: 2 },
        { designer: 'pradeep', total: 345000, timeline: '5 weeks', scope: 'Coastal styling with two concept options.', status: ProposalStatus.PENDING, daysAgo: 1 },
      ],
    },
    { n: 88, client: 'dinuka', title: 'Bathroom renovation', description: 'Replace a dated bathroom with a walk-in shower.', timeline: '5 weeks', budget: 400000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 11 },
    {
      n: 89, client: 'shalini', title: 'Dining room update', description: 'New lighting and storage for a dining room that seats eight.', timeline: '4 weeks', budget: 220000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 13,
      proposals: [{ designer: 'ruwan', total: 210000, timeline: '4 weeks', scope: 'Lighting plan and a built-in sideboard.', status: ProposalStatus.PENDING, daysAgo: 10 }],
    },
    {
      n: 90, client: 'naveen', title: 'Balcony garden', description: 'A small balcony with plants and seating for two.', timeline: '3 weeks', budget: 120000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 6,
      proposals: [{ designer: 'fathima', total: 115000, timeline: '3 weeks', scope: 'Planting plan, seating and string lights.', status: ProposalStatus.PENDING, daysAgo: 4 }],
    },
  ];

  for (const request of requests) {
    const requestId = seedId(8, request.n);
    await upsertById(
      (args) => prisma.projectRequest.upsert(args),
      [
        {
          id: requestId,
          clientId: U[request.client],
          designerId: request.designer ? U[request.designer] : null,
          briefId: request.brief ? seedId(4, request.brief) : null,
          title: request.title,
          description: request.description,
          timeline: request.timeline ?? null,
          budget: request.budget,
          type: request.type,
          status: request.status,
          createdAt: daysAgo(request.createdDaysAgo),
        },
      ],
    );
    for (const [index, proposal] of (request.proposals ?? []).entries()) {
      await upsertById(
        (args) => prisma.proposal.upsert(args),
        [
          {
            id: seedId(9, request.n * 10 + index),
            requestId,
            designerId: U[proposal.designer],
            scope: proposal.scope,
            timeline: proposal.timeline,
            stageFees: stageFees(proposal.total),
            totalAmount: proposal.total,
            status: proposal.status,
            submittedAt: daysAgo(proposal.daysAgo),
          },
        ],
      );
    }
  }

  // Messages
  await seedThread(1, [
    { from: 'designer', text: 'Hi Nadia, the proposal stage is done. Starting on concept boards this week.', daysAgo: 20 },
    { from: 'client', text: 'Great, please keep the dining table we already have.', daysAgo: 19 },
    { from: 'designer', text: 'Concept boards uploaded. Let me know your preferred direction.', daysAgo: 3, attachment: { url: photo('samples'), type: 'jpg' } },
    { from: 'designer', text: 'Option B keeps your dining table and adds open shelving.', daysAgo: 1, unread: true },
  ]);
  await seedThread(2, [
    { from: 'client', text: 'I left feedback on the design stage about the wardrobe.', daysAgo: 5 },
    { from: 'designer', text: 'Thanks, revised drawings are uploaded as v2.', daysAgo: 1 },
  ]);
  await seedThread(3, [
    { from: 'designer', text: 'Everything is installed. Enjoy the new nook!', daysAgo: 12 },
    { from: 'client', text: 'It looks brilliant, thank you.', daysAgo: 11 },
  ]);
  await seedThread(5, [
    { from: 'client', text: 'We need to pause for a few weeks while we sort out the budget.', daysAgo: 3 },
    { from: 'designer', text: 'No problem, I will keep the joinery drawings on hold.', daysAgo: 2 },
  ]);
  await seedThread(6, [
    { from: 'client', text: 'Sorry Ravi, we are moving house and have to cancel.', daysAgo: 4 },
    { from: 'designer', text: 'Understood. The proposal stage files are yours to keep.', daysAgo: 4 },
  ]);
  await seedThread(7, [
    { from: 'designer', text: 'Hi Malsha, I have started on the proposal for the kids room.', daysAgo: 1, unread: true },
  ]);

  // Reviews: published ones feed designer ratings; one waits for moderation.
  const reviewId = (n: number) => seedId(12, n);
  await upsertById(
    (args) => prisma.review.upsert(args),
    [
      { id: reviewId(1), projectId: projectId(3), reviewerId: U.sam, designerId: U.ravi, rating: 5, comment: 'Clear communication and a practical layout. Would hire again.', isVisible: true, createdAt: daysAgo(10) },
      { id: reviewId(2), projectId: projectId(8), reviewerId: U.kasun, designerId: U.ravi, rating: 4, comment: 'Lovely result, finished a few days late.', isVisible: true, createdAt: daysAgo(40) },
      { id: reviewId(3), projectId: projectId(9), reviewerId: U.nadia, designerId: U.nimal, rating: 5, comment: 'Beautiful joinery and very tidy on site.', isVisible: true, createdAt: daysAgo(70) },
      { id: reviewId(4), projectId: projectId(4), reviewerId: U.sam, designerId: U.tharushi, rating: 4, comment: 'Great ideas for the indoor-outdoor flow.', isVisible: false, createdAt: daysAgo(1) },
      ...REVIEWED.map((r, index) => ({ id: reviewId(5 + index), projectId: projectId(r.n), reviewerId: U[r.client], designerId: U[r.designer], rating: r.rating, comment: r.comment, isVisible: true, createdAt: daysAgo(Math.max(1, Math.floor(r.started / 6) - 1)) })),
    ],
  );

  // Designer verification: approved, pending and rejected with feedback
  await upsertById(
    (args) => prisma.verification.upsert(args),
    withIds(21, [
      { designerId: U.ravi, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('ravi-credentials.pdf'), notes: 'Diploma in interior design and three client references.', reviewedById: U.admin, reviewedAt: daysAgo(170), createdAt: daysAgo(175) },
      { designerId: U.tharushi, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('tharushi-credentials.pdf'), notes: 'Architecture degree and practice registration.', reviewedById: U.admin, reviewedAt: daysAgo(160), createdAt: daysAgo(165) },
      { designerId: U.nimal, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('nimal-credentials.pdf'), notes: 'Trade certificate and past work.', reviewedById: U.moderator, reviewedAt: daysAgo(150), createdAt: daysAgo(155) },
      { designerId: U.malsha, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('malsha-credentials.pdf'), notes: 'Design diploma.', reviewedById: U.moderator, reviewedAt: daysAgo(130), createdAt: daysAgo(135) },
      { designerId: U.ayesha, status: VerificationStatus.PENDING, evidenceUrl: seedFile('ayesha-credentials.pdf'), notes: 'Diploma and two client references attached.', createdAt: daysAgo(10) },
      { designerId: U.arjun, status: VerificationStatus.PENDING, evidenceUrl: seedFile('arjun-degree.pdf'), notes: 'Graduation certificate.', createdAt: daysAgo(2) },
      { designerId: U.shenali, status: VerificationStatus.REJECTED, evidenceUrl: seedFile('shenali-credentials.jpg'), notes: 'Photo of my certificate.', reviewNotes: 'The photo is too blurry to read. Please upload a clear scan or PDF.', reviewedById: U.admin, reviewedAt: daysAgo(20), createdAt: daysAgo(25) },
    ]),
  );

  // Reports in every status and across target types
  const reportedMessage = await prisma.message.findFirstOrThrow({
    where: { projectId: projectId(6), senderId: U.amaya },
  });
  await upsertById(
    (args) => prisma.report.upsert(args),
    withIds(22, [
      { reporterId: U.nadia, reportedUserId: U.ayesha, targetType: ReportTargetType.USER, targetId: U.ayesha, reason: 'Unsolicited messages outside the platform', details: 'Sample report for moderation testing.', status: ReportStatus.OPEN, createdAt: daysAgo(6) },
      { reporterId: U.ravi, reportedUserId: U.amaya, targetType: ReportTargetType.MESSAGE, targetId: reportedMessage.id, reason: 'Cancellation dispute', details: 'Wants the proposal fee refunded.', status: ReportStatus.UNDER_REVIEW, createdAt: daysAgo(3) },
      { reporterId: U.tharushi, reportedUserId: U.chaminda, targetType: ReportTargetType.PORTFOLIO, targetId: seedId(2, 15), reason: 'Copied my project photos', status: ReportStatus.RESOLVED, resolvedById: U.admin, resolvedAt: daysAgo(15), createdAt: daysAgo(18) },
      { reporterId: U.ravi, reportedUserId: U.kasun, targetType: ReportTargetType.REVIEW, targetId: reviewId(2), reason: 'Review mentions a delay I did not cause', status: ReportStatus.DISMISSED, resolvedById: U.moderator, resolvedAt: daysAgo(35), createdAt: daysAgo(38) },
      { reporterId: U.kasun, reportedUserId: U.ravindu, targetType: ReportTargetType.USER, targetId: U.ravindu, reason: 'Spam', details: 'Sent the same advert to several designers.', status: ReportStatus.RESOLVED, resolvedById: U.moderator, resolvedAt: daysAgo(50), createdAt: daysAgo(52) },
      { reporterId: U.amaya, targetType: ReportTargetType.PROJECT, targetId: projectId(6), reason: 'Designer asked for payment outside Inside', status: ReportStatus.OPEN, createdAt: daysAgo(2) },
    ]),
  );

  // Blocks
  for (const data of [
      { blockerId: U.nadia, blockedId: U.ayesha, reason: 'Sample block for trust and safety testing.' },
      { blockerId: U.kasun, blockedId: U.ravindu, reason: 'Spam messages.' },
    ]) {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: data.blockerId, blockedId: data.blockedId } },
      create: data,
      update: data,
    });
  }

  // Notifications (unread ones have readAt null)
  type NoteSeed = { user: UserKey; type: NotificationType; title: string; message: string; daysAgo: number; read?: boolean; metadata?: Prisma.InputJsonValue };
  const notes: NoteSeed[] = [
    { user: 'nadia', type: NotificationType.STAGE, title: 'Stage submitted', message: 'CONCEPT stage is awaiting your approval', daysAgo: 3, metadata: { projectId: projectId(1) } },
    { user: 'nadia', type: NotificationType.MESSAGE, title: 'New message', message: 'Ravi Jayasinghe sent a message on "Living room and kitchen refresh"', daysAgo: 1, metadata: { projectId: projectId(1) } },
    { user: 'nadia', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Tharushi Wickramasinghe sent a proposal for "Guest bathroom"', daysAgo: 2, metadata: { requestId: seedId(8, 23) } },
    { user: 'nadia', type: NotificationType.PAYMENT, title: 'Milestone released', message: 'Your PROPOSAL stage payment was released', daysAgo: 20, read: true },
    { user: 'ravi', type: NotificationType.REQUEST, title: 'New project request', message: 'Kasun Perera sent you a request: "Dining room lighting plan"', daysAgo: 2, metadata: { requestId: seedId(8, 24) } },
    { user: 'ravi', type: NotificationType.REVIEW, title: 'New review', message: 'You received a 5-star review', daysAgo: 10, read: true },
    { user: 'ravi', type: NotificationType.PROJECT, title: 'Project cancelled', message: 'Project "Home office conversion" was cancelled', daysAgo: 4, metadata: { projectId: projectId(6) } },
    { user: 'tharushi', type: NotificationType.STAGE, title: 'Stage rejected', message: 'DESIGN stage was rejected. See the feedback in the project history.', daysAgo: 5, read: true, metadata: { projectId: projectId(2) } },
    { user: 'tharushi', type: NotificationType.PROPOSAL, title: 'Proposal accepted', message: 'Your proposal for "Kids room refresh" was accepted', daysAgo: 2, metadata: { projectId: projectId(7) } },
    { user: 'kasun', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Shenali De Silva sent a proposal for "Japandi living room"', daysAgo: 3, metadata: { requestId: seedId(8, 20) } },
    { user: 'kasun', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Tharushi Wickramasinghe sent a proposal for "Japandi living room"', daysAgo: 4, metadata: { requestId: seedId(8, 20) } },
    { user: 'kasun', type: NotificationType.PROPOSAL, title: 'Proposal withdrawn', message: 'Ayesha Designer withdrew their proposal for "Japandi living room"', daysAgo: 4, read: true },
    { user: 'sam', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Ravi Jayasinghe sent a proposal for "Coastal master bedroom redesign"', daysAgo: 9, read: true },
    { user: 'shenali', type: NotificationType.VERIFICATION, title: 'Verification rejected', message: 'Verification rejected: The photo is too blurry to read. Please upload a clear scan or PDF.', daysAgo: 20 },
    { user: 'shenali', type: NotificationType.PROPOSAL, title: 'Proposal declined', message: 'Your proposal for "Entrance hallway" was declined', daysAgo: 9 },
    { user: 'amaya', type: NotificationType.REQUEST, title: 'Request declined', message: 'Nimal Herath declined your request "Townhouse kitchen"', daysAgo: 18, read: true },
    { user: 'malsha', type: NotificationType.MESSAGE, title: 'New message', message: 'Tharushi Wickramasinghe sent a message on "Kids room refresh"', daysAgo: 1, metadata: { projectId: projectId(7) } },
    { user: 'chaminda', type: NotificationType.SYSTEM, title: 'Account suspended', message: 'Your account was suspended by an administrator', daysAgo: 15 },
  ];
  await upsertById(
    (args) => prisma.notification.upsert(args),
    withIds(24, notes.map((note) => ({
      userId: U[note.user],
      type: note.type,
      title: note.title,
      message: note.message,
      metadata: note.metadata,
      isRead: Boolean(note.read),
      readAt: note.read ? daysAgo(Math.max(0, note.daysAgo - 0.5)) : null,
      createdAt: daysAgo(note.daysAgo),
    }))),
  );

  // Admin audit trail
  await upsertById(
    (args) => prisma.activityLog.upsert(args),
    withIds(16, [
      { userId: U.admin, action: 'VERIFICATION_APPROVED', metadata: { designerId: U.ravi }, createdAt: daysAgo(170) },
      { userId: U.admin, action: 'VERIFICATION_APPROVED', metadata: { designerId: U.tharushi }, createdAt: daysAgo(160) },
      { userId: U.moderator, action: 'VERIFICATION_APPROVED', metadata: { designerId: U.nimal }, createdAt: daysAgo(150) },
      { userId: U.moderator, action: 'VERIFICATION_APPROVED', metadata: { designerId: U.malsha }, createdAt: daysAgo(130) },
      { userId: U.admin, action: 'VERIFICATION_REJECTED', metadata: { designerId: U.shenali }, createdAt: daysAgo(20) },
      { userId: U.moderator, action: 'REPORT_RESOLVED', metadata: { targetUserId: U.ravindu }, createdAt: daysAgo(50) },
      { userId: U.moderator, action: 'USER_SUSPENDED', metadata: { targetUserId: U.ravindu }, createdAt: daysAgo(50) },
      { userId: U.moderator, action: 'REPORT_DISMISSED', metadata: { reviewId: reviewId(2) }, createdAt: daysAgo(35) },
      { userId: U.admin, action: 'REPORT_RESOLVED', metadata: { targetUserId: U.chaminda }, createdAt: daysAgo(15) },
      { userId: U.admin, action: 'USER_SUSPENDED', metadata: { targetUserId: U.chaminda }, createdAt: daysAgo(15) },
      { userId: U.admin, action: 'REPORT_UNDER_REVIEW', metadata: { targetUserId: U.amaya }, createdAt: daysAgo(2) },
    ], 100000),
  );

  // Newsletter
  for (const data of [
      { email: 'client@insidesign.me', createdAt: daysAgo(100) },
      { email: 'designer3@insidesign.me', createdAt: daysAgo(90) },
      { email: 'reader.one@example.com', createdAt: daysAgo(12) },
      { email: 'reader.two@example.com', createdAt: daysAgo(3) },
    ]) {
    await prisma.newsletterSubscriber.upsert({ where: { email: data.email }, create: data, update: data });
  }

  for (const { id, ...data } of PRODUCT_SEED) {
    await prisma.product.upsert({
      where: { id: id as string },
      create: { id: id as string, ...data },
      update: data,
    });
  }

  loadEnvFiles();
  const demoAdded = await seedDemoAccounts();

  if (cloudinaryCredentials()) {
    const images = await migrateImages(prisma, { apply: true });
    console.log(`Images copied to Cloudinary: ${images.uploaded}, failed: ${images.failed.length}`);
  }

  console.log('Seed complete.');
  console.log(`All accounts use the password ${SEED_PASSWORD}`);
  for (const user of USERS) {
    console.log(`  ${user.email.padEnd(32)} ${user.role.padEnd(8)} ${user.name}`);
  }
  if (demoAdded) {
    console.log('Demo accounts (admin, designer, client) added from DEMO_* variables, using DEMO_PASSWORD.');
  }
}

async function seedDemoAccounts() {
  const emails = {
    demoAdmin: process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase(),
    demoDesigner: process.env.DEMO_DESIGNER_EMAIL?.trim().toLowerCase(),
    demoClient: process.env.DEMO_CLIENT_EMAIL?.trim().toLowerCase(),
  };
  const set = Object.values(emails).filter(Boolean).length;
  if (set === 0) return false;
  if (set < 3) throw new Error('Set all three DEMO_*_EMAIL variables, or none of them.');
  const password = process.env.DEMO_PASSWORD ?? '';
  if (password.length < 12) throw new Error('Set DEMO_PASSWORD (12+ characters) for the demo accounts.');

  const passwordHash = await bcrypt.hash(password, 10);
  const people: { key: 'demoAdmin' | 'demoDesigner' | 'demoClient'; name: string; role: Role; isVerified?: boolean; location?: string; bio?: string; joinedDaysAgo: number }[] = [
    { key: 'demoAdmin', name: 'Inside Admin', role: Role.ADMIN, joinedDaysAgo: 200 },
    { key: 'demoDesigner', name: 'Kavya Senanayake', role: Role.DESIGNER, isVerified: true, location: 'Colombo', bio: 'Warm contemporary homes with natural materials and clever storage. 8 years experience.', joinedDaysAgo: 190 },
    { key: 'demoClient', name: 'Rashmi Perera', role: Role.CLIENT, location: 'Colombo', bio: 'Renovating a family apartment, one room at a time.', joinedDaysAgo: 130 },
  ];
  for (const person of people) {
    const email = emails[person.key]!;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== U[person.key]) {
      throw new Error(`${email} already belongs to another account. Delete that account first.`);
    }
    const data = {
      id: U[person.key],
      email,
      passwordHash,
      name: person.name,
      role: person.role,
      activeRole: person.role,
      isVerified: person.isVerified ?? false,
      emailVerified: daysAgo(person.joinedDaysAgo),
      status: AccountStatus.ACTIVE,
      location: person.location ?? null,
      bio: person.bio ?? null,
      createdAt: daysAgo(person.joinedDaysAgo),
    };
    await prisma.user.upsert({ where: { id: data.id }, create: data, update: data });
  }

  // Portfolio
  const portfolios: Omit<PortfolioSeed, 'designer'>[] = [
    { title: 'Warm Contemporary Living Room', description: 'Linen sofas, oak joinery and layered evening lighting.', style: 'Contemporary', roomType: 'Living Room', budget: 520000, images: [['scandiLiving', 'Living room'], ['seating', 'Seating corner']], createdDaysAgo: 160 },
    { title: 'Handleless Oak Kitchen', description: 'A clean oak kitchen with a long island and hidden storage.', style: 'Minimalist', roomType: 'Kitchen', budget: 900000, images: [['kitchen', 'Island']], createdDaysAgo: 120 },
    { title: 'Quiet Master Bedroom', description: 'Soft neutrals, a built-in wardrobe and warm bedside lights.', style: 'Japandi', roomType: 'Bedroom', budget: 400000, images: [['retreat', 'Bedroom'], ['neutrals', 'Material palette']], createdDaysAgo: 80 },
    { title: 'Courtyard Dining Room', description: 'A dining room that opens onto a planted courtyard.', style: 'Tropical Modern', roomType: 'Dining Room', budget: 650000, images: [['loft', 'Dining area'], ['villa', 'Courtyard view']], createdDaysAgo: 40 },
  ];
  for (const [index, item] of portfolios.entries()) {
    const data = {
      id: seedId(2, 900 + index),
      designerId: U.demoDesigner,
      title: item.title,
      description: item.description,
      style: item.style,
      roomType: item.roomType,
      budget: item.budget,
      isPublished: true,
      createdAt: daysAgo(item.createdDaysAgo),
    };
    const images = item.images.map(([key, caption], order) => ({ imageUrl: photo(key), caption, displayOrder: order }));
    await prisma.portfolio.upsert({
      where: { id: data.id },
      create: { ...data, images: { create: images } },
      update: { ...data, images: { deleteMany: {}, create: images } },
    });
  }

  await upsertById(
    (args) => prisma.verification.upsert(args),
    withIds(21, [
      { designerId: U.demoDesigner, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('kavya-credentials.pdf'), notes: 'Interior design degree and four client references.', reviewedById: U.demoAdmin, reviewedAt: daysAgo(180), createdAt: daysAgo(185) },
    ], 900),
  );

  // Client planning
  await upsertById(
    (args) => prisma.moodboard.upsert(args),
    [{ id: seedId(3, 90), clientId: U.demoClient, name: 'Family Apartment', savedItems: [['neutrals', 'Warm neutrals'], ['shelving', 'Open shelving'], ['kitchen', 'Oak kitchen']].map(([key, note]) => ({ imageUrl: photo(key as PhotoKey, 800), note })) }],
  );
  await upsertById(
    (args) => prisma.brief.upsert(args),
    [{ id: seedId(4, 90), clientId: U.demoClient, moodboardId: seedId(3, 90), styles: ['Contemporary', 'Japandi'], rooms: ['Bathroom'], budgetRange: '250000-400000', description: 'A bright family bathroom with a walk-in shower and more storage.' }],
  );
  for (const data of [
    { clientId: U.demoClient, designerId: U.demoDesigner },
    { clientId: U.demoClient, designerId: U.tharushi },
  ]) {
    await prisma.favourite.upsert({ where: { clientId_designerId: data }, create: data, update: {} });
  }

  // Projects
  for (const plan of DEMO_PROJECTS) {
    await seedProject(plan);
  }

  // Requests: an open one from the client, a pending one for the designer
  await upsertById(
    (args) => prisma.projectRequest.upsert(args),
    [
      { id: seedId(8, 91), clientId: U.demoClient, briefId: seedId(4, 90), title: 'Family bathroom renovation', description: 'Open to proposals: a bright family bathroom with a walk-in shower.', timeline: '5 weeks', budget: 350000, type: RequestType.OPEN, status: RequestStatus.OPEN, createdDaysAgo: 3 },
      { id: seedId(8, 92), clientId: U.amaya, designerId: U.demoDesigner, title: 'Townhouse living room', description: 'Would love your take on our townhouse living room.', timeline: '8 weeks', budget: 600000, type: RequestType.DIRECT, status: RequestStatus.PENDING, createdDaysAgo: 2 },
    ].map(({ createdDaysAgo, ...row }) => ({ designerId: null, briefId: null, ...row, createdAt: daysAgo(createdDaysAgo) })),
  );
  await upsertById(
    (args) => prisma.proposal.upsert(args),
    [
      { id: seedId(9, 910), requestId: seedId(8, 91), designerId: U.ravi, scope: 'Layout, tiling plan, lighting and a fittings schedule.', timeline: '5 weeks', stageFees: stageFees(340000), totalAmount: 340000, status: ProposalStatus.PENDING, submittedAt: daysAgo(2) },
      { id: seedId(9, 911), requestId: seedId(8, 91), designerId: U.shenali, scope: 'Japandi wet room concept with a sourcing list.', timeline: '4 weeks', stageFees: stageFees(310000), totalAmount: 310000, status: ProposalStatus.PENDING, submittedAt: daysAgo(1) },
    ],
  );

  // Messages
  await seedThread(100, [
    { from: 'designer', text: 'Hi Rashmi, the proposal stage is signed off. I am starting on the concept boards now.', daysAgo: 22 },
    { from: 'client', text: 'Lovely. Please keep the teak dining chairs, they were my grandmother\'s.', daysAgo: 21 },
    { from: 'designer', text: 'Of course, they will set the tone for the whole room.', daysAgo: 21 },
    { from: 'designer', text: 'Concept boards are uploaded. Option A is lighter, option B is warmer.', daysAgo: 2, attachment: { url: photo('samples'), type: 'jpg' } },
    { from: 'designer', text: 'Let me know which way you lean and I will start on the 3D visuals.', daysAgo: 1, unread: true },
  ]);
  await seedThread(101, [
    { from: 'designer', text: 'Everything is styled and photographed. Thank you for a lovely project.', daysAgo: 30 },
    { from: 'client', text: 'We are sleeping so much better. Thank you, Kavya!', daysAgo: 29 },
  ]);
  await seedThread(102, [
    { from: 'client', text: 'I left feedback on the design stage about the desk position.', daysAgo: 6 },
    { from: 'designer', text: 'Thanks Rashmi, revised drawings with the desk facing the garden are uploaded as v2.', daysAgo: 1 },
  ]);
  await seedThread(103, [
    { from: 'client', text: 'Hi Kavya, can we keep the existing bed frame?', daysAgo: 10 },
    { from: 'designer', text: 'Yes, I have built the concept around it.', daysAgo: 9 },
  ]);

  // Reviews
  await upsertById(
    (args) => prisma.review.upsert(args),
    [
      { id: seedId(12, 90), projectId: projectId(101), reviewerId: U.demoClient, designerId: U.demoDesigner, rating: 5, comment: 'Kavya listened to every detail and the bedroom feels like a hotel suite.', isVisible: true, createdAt: daysAgo(28) },
      { id: seedId(12, 91), projectId: projectId(104), reviewerId: U.kasun, designerId: U.demoDesigner, rating: 5, comment: 'Brilliant kitchen, finished on time and on budget.', isVisible: true, createdAt: daysAgo(60) },
    ],
  );

  // Notifications
  const demoNotes: { user: UserKey; type: NotificationType; title: string; message: string; daysAgo: number; read?: boolean; metadata?: Prisma.InputJsonValue }[] = [
    { user: 'demoClient', type: NotificationType.STAGE, title: 'Stage submitted', message: 'CONCEPT stage is awaiting your approval', daysAgo: 2, metadata: { projectId: projectId(100) } },
    { user: 'demoClient', type: NotificationType.MESSAGE, title: 'New message', message: 'Kavya Senanayake sent a message on "Open-plan apartment refresh"', daysAgo: 1, metadata: { projectId: projectId(100) } },
    { user: 'demoClient', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Shenali De Silva sent a proposal for "Family bathroom renovation"', daysAgo: 1, metadata: { requestId: seedId(8, 91) } },
    { user: 'demoClient', type: NotificationType.PAYMENT, title: 'Milestone released', message: 'Your PROPOSAL stage payment was released', daysAgo: 20, read: true },
    { user: 'demoDesigner', type: NotificationType.REQUEST, title: 'New project request', message: 'Amaya Fernando sent you a request: "Townhouse living room"', daysAgo: 2, metadata: { requestId: seedId(8, 92) } },
    { user: 'demoDesigner', type: NotificationType.REVIEW, title: 'New review', message: 'You received a 5-star review', daysAgo: 28, read: true },
    { user: 'demoDesigner', type: NotificationType.MESSAGE, title: 'New message', message: 'Sam Client sent a message on "Coastal guest bedroom"', daysAgo: 10, read: true, metadata: { projectId: projectId(103) } },
  ];
  await upsertById(
    (args) => prisma.notification.upsert(args),
    withIds(24, demoNotes.map((note) => ({
      userId: U[note.user],
      type: note.type,
      title: note.title,
      message: note.message,
      metadata: note.metadata,
      isRead: Boolean(note.read),
      readAt: note.read ? daysAgo(Math.max(0, note.daysAgo - 0.5)) : null,
      createdAt: daysAgo(note.daysAgo),
    })), 900),
  );

  return true;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
