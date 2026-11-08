/**
 * Sample data for local development and manual testing.
 *
 * Every run RESETS all app tables and inserts the same data set, with fixed ids and
 * timestamps relative to "now", so results are predictable. Refuses to run in production.
 * Accounts and scenarios are documented in docs/SEED_DATA.md.
 */
import {
  AccountStatus,
  AuthTokenType,
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

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Unsplash photos already used by the app; all verified to resolve.
const PHOTOS = {
  scandiLiving: '1586023492125-27b2c045efd7',
  seating: '1560448204-e02f11c3d0e2',
  kitchen: '1556912173-46c336c7fd55',
  coastalBedroom: '1616594039964-ae9021a400a0',
  neutrals: '1616137466211-f947bda0ca6d',
  shelving: '1616486338812-3dadae4b4ace',
  hero: '1600210491892-03d54c0aaf87',
  villa: '1632119580908-ae947d4c7691',
  loft: '1600210491369-e753d80a41f3',
  townhouse: '1633330977020-2bdfb8530cc2',
  retreat: '1688646953306-5ec93eab8c06',
  samples: '1637649228998-6c78a67dfa6c',
  lounge: '1613545325278-f24b0cae1224',
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
  'AuthToken',
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
  { key: 'admin', email: 'admin@inside.test', name: 'Platform Admin', role: Role.ADMIN, joinedDaysAgo: 200 },
  { key: 'moderator', email: 'moderator@inside.test', name: 'Dilini Moderator', role: Role.ADMIN, joinedDaysAgo: 150 },

  { key: 'nadia', email: 'client@inside.test', name: 'Nadia Client', role: Role.CLIENT, location: 'Colombo', phone: '+94771234567', bio: 'Renovating a two-bedroom apartment.', joinedDaysAgo: 120 },
  { key: 'sam', email: 'client2@inside.test', name: 'Sam Client', role: Role.CLIENT, location: 'Negombo', bio: 'Looking for a coastal bedroom redesign.', joinedDaysAgo: 110 },
  { key: 'kasun', email: 'client3@inside.test', name: 'Kasun Perera', role: Role.CLIENT, location: 'Kandy', bio: 'Updating a family home one room at a time.', joinedDaysAgo: 95 },
  { key: 'amaya', email: 'client4@inside.test', name: 'Amaya Fernando', role: Role.CLIENT, location: 'Galle', bio: 'Restoring a colonial-era townhouse.', joinedDaysAgo: 80 },
  { key: 'ishan', email: 'client5@inside.test', name: 'Ishan Jayawardena', role: Role.CLIENT, location: 'Jaffna', emailVerified: false, joinedDaysAgo: 1 },
  { key: 'ravindu', email: 'suspended.client@inside.test', name: 'Ravindu Silva', role: Role.CLIENT, status: AccountStatus.SUSPENDED, location: 'Colombo', joinedDaysAgo: 60 },

  { key: 'ravi', email: 'designer@inside.test', name: 'Ravi Designer', role: Role.DESIGNER, isVerified: true, location: 'Kandy', bio: 'Minimalist and Scandinavian interiors, 6 years experience.', joinedDaysAgo: 180 },
  { key: 'ayesha', email: 'designer2@inside.test', name: 'Ayesha Designer', role: Role.DESIGNER, emailVerified: false, location: 'Galle', bio: 'Coastal and relaxed interiors for small homes.', joinedDaysAgo: 20 },
  { key: 'tharushi', email: 'designer3@inside.test', name: 'Tharushi Wickramasinghe', role: Role.DESIGNER, isVerified: true, location: 'Colombo', bio: 'Tropical modern homes that stay cool without extra air conditioning.', joinedDaysAgo: 170 },
  { key: 'nimal', email: 'designer4@inside.test', name: 'Nimal Herath', role: Role.DESIGNER, isVerified: true, isAvailable: false, location: 'Kurunegala', bio: 'Kitchens and joinery. Fully booked until next quarter.', joinedDaysAgo: 160 },
  { key: 'shenali', email: 'designer5@inside.test', name: 'Shenali De Silva', role: Role.DESIGNER, location: 'Colombo', bio: 'Japandi and contemporary spaces with natural materials.', joinedDaysAgo: 45 },
  { key: 'arjun', email: 'designer6@inside.test', name: 'Arjun Kumar', role: Role.DESIGNER, location: 'Jaffna', bio: 'Recent graduate, building a portfolio.', joinedDaysAgo: 5 },
  { key: 'malsha', email: 'designer7@inside.test', name: 'Malsha Gunawardena', role: Role.DESIGNER, activeRole: Role.CLIENT, isVerified: true, location: 'Matara', bio: 'Bohemian and colourful family spaces.', joinedDaysAgo: 140 },
  { key: 'chaminda', email: 'suspended.designer@inside.test', name: 'Chaminda Bandara', role: Role.DESIGNER, status: AccountStatus.SUSPENDED, location: 'Negombo', bio: 'Industrial lofts.', joinedDaysAgo: 70 },
];

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
  { designer: 'ravi', title: 'Quiet Home Office', description: 'A calm corner for focused work, with built-in shelving.', style: 'Minimalist', roomType: 'Home Office', budget: 220000, images: [['shelving', 'Shelving wall'], ['neutrals', 'Desk area']], createdDaysAgo: 90 },

  { designer: 'tharushi', title: 'Colombo Loft', description: 'Cross-ventilation, timber screens and a courtyard view.', style: 'Tropical Modern', roomType: 'Living Room', budget: 1200000, images: [['loft', 'Double-height lounge'], ['hero', 'Courtyard edge']], createdDaysAgo: 160 },
  { designer: 'tharushi', title: 'Kalutara Villa Bedroom', description: 'Shaded verandah bedroom with natural fibres.', style: 'Tropical Modern', roomType: 'Bedroom', budget: 650000, images: [['villa', 'Bedroom and verandah']], createdDaysAgo: 120 },
  { designer: 'tharushi', title: 'Open Dining Pavilion', description: 'An open-sided dining space for family gatherings.', style: 'Contemporary', roomType: 'Dining Room', budget: 900000, images: [['lounge', 'Dining pavilion']], createdDaysAgo: 60 },

  { designer: 'nimal', title: 'Family Kitchen in Teak', description: 'Solid teak joinery with a large prep island.', style: 'Traditional', roomType: 'Kitchen', budget: 1500000, images: [['kitchen', 'Teak island'], ['samples', 'Material samples']], createdDaysAgo: 150 },
  { designer: 'nimal', title: 'Reading Corner', description: 'Window seat with storage and warm task lighting.', style: 'Contemporary', roomType: 'Living Room', budget: 180000, images: [['seating', 'Window seat']], createdDaysAgo: 100 },

  { designer: 'ayesha', title: 'Coastal Bedroom Concept', description: 'Soft blues and rattan accents for a calm sleep space.', style: 'Coastal', roomType: 'Bedroom', budget: 320000, images: [['coastalBedroom', 'Headboard wall']], createdDaysAgo: 15 },

  { designer: 'shenali', title: 'Japandi Apartment', description: 'Low furniture, linen and pale timber.', style: 'Japandi', roomType: 'Living Room', budget: 550000, images: [['retreat', 'Living area'], ['neutrals', 'Material palette']], createdDaysAgo: 40 },
  { designer: 'shenali', title: 'Spa Bathroom', description: 'Terrazzo, warm lighting and a walk-in shower.', style: 'Japandi', roomType: 'Bathroom', budget: 400000, images: [['townhouse', 'Vanity']], createdDaysAgo: 30 },

  { designer: 'arjun', title: 'Student Studio (draft)', description: 'Work in progress for a compact studio flat.', style: 'Minimalist', roomType: 'Bedroom', budget: null, published: false, images: [['shelving', 'Study wall']], createdDaysAgo: 3 },

  { designer: 'malsha', title: 'Colourful Kids Room', description: 'Bold colour, bunk beds and plenty of floor space.', style: 'Bohemian', roomType: 'Kids Room', budget: 280000, images: [['neutrals', 'Play corner']], createdDaysAgo: 130 },
  { designer: 'malsha', title: 'Boho Balcony Garden', description: 'Planters, floor cushions and string lights.', style: 'Bohemian', roomType: 'Balcony', budget: 150000, images: [['villa', 'Balcony view']], createdDaysAgo: 110 },

  { designer: 'chaminda', title: 'Industrial Loft', description: 'Exposed brick and steel shelving.', style: 'Industrial', roomType: 'Living Room', budget: 700000, images: [['loft', 'Loft']], createdDaysAgo: 65 },
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
  latestPayment?: PaymentStatus;
  rejection?: { reason: string; revised: boolean };
  pausedBy?: UserKey;
  cancelled?: { by: UserKey; reason: string };
};

const A = StageStatus.APPROVED;
const S = StageStatus.SUBMITTED;
const I = StageStatus.IN_PROGRESS;
const R = StageStatus.REJECTED;
const P = StageStatus.PENDING;

const PROJECTS: ProjectPlan[] = [
  { n: 1, title: 'Living room and kitchen refresh', client: 'nadia', designer: 'ravi', total: 700000, timeline: '12 weeks', scope: 'Concept boards, 3D visuals, a furniture schedule and site supervision for two rooms.', startedDaysAgo: 24, stages: [A, S, P, P, P], latestPayment: PaymentStatus.RELEASED },
  { n: 2, title: 'Master bedroom makeover', client: 'nadia', designer: 'tharushi', total: 600000, timeline: '10 weeks', scope: 'Bedroom layout, lighting plan, joinery and styling.', startedDaysAgo: 40, stages: [A, A, R, P, P], latestPayment: PaymentStatus.PAID, rejection: { reason: 'The wardrobe blocks the window light. Could you move it to the east wall and lighten the finish?', revised: true } },
  { n: 3, title: 'Studio nook makeover', client: 'sam', designer: 'ravi', total: 180000, timeline: '4 weeks', scope: 'Layout plan and furniture sourcing for a work nook.', startedDaysAgo: 60, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 4, title: 'Beach house dining area', client: 'sam', designer: 'tharushi', total: 450000, timeline: '8 weeks', scope: 'Dining area redesign with outdoor flow.', startedDaysAgo: 75, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 5, title: 'Family kitchen upgrade', client: 'kasun', designer: 'nimal', total: 1400000, timeline: '16 weeks', scope: 'Full kitchen redesign with custom teak joinery.', startedDaysAgo: 35, stages: [A, A, I, P, P], status: ProjectStatus.ON_HOLD, latestPayment: PaymentStatus.PENDING, pausedBy: 'kasun' },
  { n: 6, title: 'Home office conversion', client: 'amaya', designer: 'ravi', total: 250000, timeline: '5 weeks', scope: 'Convert a spare room into a home office.', startedDaysAgo: 30, stages: [A, I, P, P, P], status: ProjectStatus.CANCELLED, latestPayment: PaymentStatus.RELEASED, cancelled: { by: 'amaya', reason: 'We are moving house sooner than planned, so the room will not be needed.' } },
  { n: 7, title: 'Kids room refresh', client: 'malsha', designer: 'tharushi', total: 300000, timeline: '6 weeks', scope: 'Brighter kids room with more storage and a study desk.', startedDaysAgo: 2, stages: [I, P, P, P, P] },
  { n: 8, title: 'Apartment balcony garden', client: 'kasun', designer: 'ravi', total: 150000, timeline: '3 weeks', scope: 'Planting plan and seating for a small balcony.', startedDaysAgo: 90, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
  { n: 9, title: 'Reading corner', client: 'nadia', designer: 'nimal', total: 180000, timeline: '4 weeks', scope: 'Window seat with storage and lighting.', startedDaysAgo: 100, stages: [A, A, A, A, A], status: ProjectStatus.COMPLETED },
];

const projectId = (n: number) => seedId(10, n);

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

  await prisma.projectRequest.create({
    data: {
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
  });
  await prisma.proposal.create({
    data: {
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
  });

  const currentIndex = plan.stages.findIndex((s) => s !== StageStatus.APPROVED);
  const completed = status === ProjectStatus.COMPLETED;
  await prisma.project.create({
    data: {
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
  });

  const logs: Prisma.ActivityLogCreateManyInput[] = [
    { projectId: id, userId: client, action: 'PROPOSAL_ACCEPTED', metadata: { proposalId, requestId }, createdAt: startedAt },
  ];
  const lastApproved = plan.stages.lastIndexOf(StageStatus.APPROVED);

  for (const [index, stageStatus] of plan.stages.entries()) {
    const stageId = seedId(11, plan.n * 10 + index + 1);
    const name = STAGES[index];
    const touched = stageStatus !== StageStatus.PENDING;
    const reviewed =
      stageStatus === StageStatus.APPROVED || stageStatus === StageStatus.REJECTED;
    const submitted = reviewed || stageStatus === StageStatus.SUBMITTED;

    await prisma.projectStage.create({
      data: {
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
    });

    if (index === 0 && touched) {
      logs.push({ projectId: id, userId: designer, action: 'STAGE_STARTED', metadata: { stageId, name }, createdAt: startedAt });
    }

    if (submitted) {
      const isImage = index % 2 === 1;
      await prisma.deliverable.create({
        data: {
          stageId,
          version: 1,
          fileUrl: isImage ? photo('samples') : seedFile(`${name.toLowerCase()}-v1.pdf`),
          fileName: `${name.toLowerCase()}-v1.${isImage ? 'jpg' : 'pdf'}`,
          notes: `${name.charAt(0)}${name.slice(1).toLowerCase()} stage deliverable.`,
          feedback: stageStatus === StageStatus.REJECTED ? plan.rejection?.reason : null,
          uploadedAt: at(index, 2),
        },
      });
      logs.push(
        { projectId: id, userId: designer, action: 'DELIVERABLE_UPLOADED', metadata: { stageId, version: 1 }, createdAt: at(index, 2) },
        { projectId: id, userId: designer, action: 'STAGE_SUBMITTED', metadata: { stageId, name, version: 1 }, createdAt: at(index, 1) },
      );
    }

    if (stageStatus === StageStatus.REJECTED && plan.rejection) {
      logs.push({ projectId: id, userId: client, action: 'STAGE_REJECTED', metadata: { stageId, name, reason: plan.rejection.reason }, createdAt: at(index) });
      if (plan.rejection.revised) {
        await prisma.deliverable.create({
          data: {
            stageId,
            version: 2,
            fileUrl: seedFile(`${name.toLowerCase()}-v2.pdf`),
            fileName: `${name.toLowerCase()}-v2.pdf`,
            notes: 'Revised after client feedback.',
            uploadedAt: daysAgo(1),
          },
        });
        logs.push({ projectId: id, userId: designer, action: 'DELIVERABLE_UPLOADED', metadata: { stageId, version: 2 }, createdAt: daysAgo(1) });
      }
    }

    if (stageStatus === StageStatus.APPROVED) {
      logs.push({ projectId: id, userId: client, action: 'STAGE_APPROVED', metadata: { stageId, name }, createdAt: at(index) });
      const paymentStatus =
        completed || index < lastApproved
          ? PaymentStatus.RELEASED
          : (plan.latestPayment ?? PaymentStatus.PENDING);
      const paid = paymentStatus !== PaymentStatus.PENDING;
      const released = paymentStatus === PaymentStatus.RELEASED;
      await prisma.milestonePayment.create({
        data: {
          projectId: id,
          stageId,
          amount: fees[index].fee,
          status: paymentStatus,
          paidAt: paid ? at(index) : null,
          releasedAt: released ? at(index) : null,
          createdAt: at(index),
        },
      });
      if (paid) {
        logs.push({ projectId: id, userId: client, action: 'PAYMENT_PAID', metadata: { amount: fees[index].fee }, createdAt: at(index) });
      }
      if (released) {
        logs.push({ projectId: id, userId: client, action: 'PAYMENT_RELEASED', metadata: { amount: fees[index].fee }, createdAt: at(index) });
      }
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

  await prisma.activityLog.createMany({ data: logs });
}

type Line = {
  from: 'client' | 'designer';
  text: string;
  daysAgo: number;
  attachment?: { url: string; type: string };
  unread?: boolean;
};

async function seedThread(n: number, lines: Line[]) {
  const plan = PROJECTS.find((p) => p.n === n);
  if (!plan) throw new Error(`No project ${n}`);
  const people = { client: U[plan.client], designer: U[plan.designer] };
  await prisma.message.createMany({
    data: lines.map((line) => {
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
    }),
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset and seed a production database.');
  }

  const [{ db }] = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
  console.log(`Resetting and seeding "${db}"...`);
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} CASCADE`,
  );

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Users
  await prisma.user.createMany({
    data: USERS.map((user) => ({
      id: U[user.key],
      email: user.email,
      passwordHash,
      name: user.name,
      role: user.role,
      activeRole: user.activeRole ?? user.role,
      isVerified: user.isVerified ?? false,
      emailVerified: user.emailVerified === false ? null : daysAgo(user.joinedDaysAgo),
      status: user.status ?? AccountStatus.ACTIVE,
      isAvailable: user.isAvailable ?? true,
      location: user.location ?? null,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      createdAt: daysAgo(user.joinedDaysAgo),
    })),
  });

  // Demo auth tokens with known raw values (see docs/SEED_DATA.md), and one session.
  await prisma.authToken.createMany({
    data: [
      { userId: U.ayesha, tokenHash: hashToken('seed-email-verify-pending-designer'), type: AuthTokenType.EMAIL_VERIFY, expiresAt: daysFromNow(1) },
      { userId: U.ishan, tokenHash: hashToken('seed-email-verify-new-client'), type: AuthTokenType.EMAIL_VERIFY, expiresAt: daysFromNow(1) },
      { userId: U.nadia, tokenHash: hashToken('seed-password-reset-client'), type: AuthTokenType.PASSWORD_RESET, expiresAt: new Date(NOW + 60 * 60 * 1000) },
    ],
  });
  await prisma.session.create({
    data: {
      userId: U.nadia,
      refreshTokenHash: hashToken('seed-client-refresh'),
      userAgent: 'SeedBrowser/1.0',
      ipAddress: '127.0.0.1',
      expiresAt: daysFromNow(7),
    },
  });

  // Portfolios
  for (const [index, item] of PORTFOLIOS.entries()) {
    await prisma.portfolio.create({
      data: {
        id: seedId(2, index + 1),
        designerId: U[item.designer],
        title: item.title,
        description: item.description,
        style: item.style,
        roomType: item.roomType,
        budget: item.budget,
        isPublished: item.published ?? true,
        createdAt: daysAgo(item.createdDaysAgo),
        images: {
          create: item.images.map(([key, caption], order) => ({
            imageUrl: photo(key),
            caption,
            displayOrder: order,
          })),
        },
      },
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
  await prisma.favourite.createMany({
    data: favourites.map(([client, designer]) => ({ clientId: U[client], designerId: U[designer] })),
  });

  // Moodboards and briefs
  const moodboards: { n: number; client: UserKey; name: string; items: [PhotoKey, string][] }[] = [
    { n: 1, client: 'nadia', name: 'Apartment Refresh', items: [['neutrals', 'Warm neutrals'], ['shelving', 'Open shelving'], ['scandiLiving', 'Light oak floor']] },
    { n: 2, client: 'nadia', name: 'Bedroom Calm', items: [['villa', 'Verandah light'], ['coastalBedroom', 'Soft textiles']] },
    { n: 3, client: 'sam', name: 'Coastal Bedroom', items: [['coastalBedroom', 'Soft blue palette']] },
    { n: 4, client: 'kasun', name: 'Japandi Living', items: [['retreat', 'Low furniture'], ['samples', 'Linen and timber']] },
    { n: 5, client: 'amaya', name: 'Townhouse Bathroom', items: [['townhouse', 'Terrazzo']] },
  ];
  for (const board of moodboards) {
    await prisma.moodboard.create({
      data: {
        id: seedId(3, board.n),
        clientId: U[board.client],
        name: board.name,
        savedItems: board.items.map(([key, note]) => ({ imageUrl: photo(key, 800), note })),
      },
    });
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
    await prisma.brief.create({
      data: {
        id: seedId(4, brief.n),
        clientId: U[brief.client],
        moodboardId: brief.moodboard ? seedId(3, brief.moodboard) : null,
        styles: brief.styles,
        rooms: brief.rooms,
        budgetRange: brief.budgetRange,
        description: brief.description,
      },
    });
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
  ];

  for (const request of requests) {
    const requestId = seedId(8, request.n);
    await prisma.projectRequest.create({
      data: {
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
    });
    for (const [index, proposal] of (request.proposals ?? []).entries()) {
      await prisma.proposal.create({
        data: {
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
      });
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
  await prisma.review.createMany({
    data: [
      { id: reviewId(1), projectId: projectId(3), reviewerId: U.sam, designerId: U.ravi, rating: 5, comment: 'Clear communication and a practical layout. Would hire again.', isVisible: true, createdAt: daysAgo(10) },
      { id: reviewId(2), projectId: projectId(8), reviewerId: U.kasun, designerId: U.ravi, rating: 4, comment: 'Lovely result, finished a few days late.', isVisible: true, createdAt: daysAgo(40) },
      { id: reviewId(3), projectId: projectId(9), reviewerId: U.nadia, designerId: U.nimal, rating: 5, comment: 'Beautiful joinery and very tidy on site.', isVisible: true, createdAt: daysAgo(70) },
      { id: reviewId(4), projectId: projectId(4), reviewerId: U.sam, designerId: U.tharushi, rating: 4, comment: 'Great ideas for the indoor-outdoor flow.', isVisible: false, createdAt: daysAgo(1) },
    ],
  });

  // Designer verification: approved, pending and rejected with feedback
  await prisma.verification.createMany({
    data: [
      { designerId: U.ravi, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('ravi-credentials.pdf'), notes: 'Diploma in interior design and three client references.', reviewedById: U.admin, reviewedAt: daysAgo(170), createdAt: daysAgo(175) },
      { designerId: U.tharushi, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('tharushi-credentials.pdf'), notes: 'Architecture degree and practice registration.', reviewedById: U.admin, reviewedAt: daysAgo(160), createdAt: daysAgo(165) },
      { designerId: U.nimal, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('nimal-credentials.pdf'), notes: 'Trade certificate and past work.', reviewedById: U.moderator, reviewedAt: daysAgo(150), createdAt: daysAgo(155) },
      { designerId: U.malsha, status: VerificationStatus.APPROVED, evidenceUrl: seedFile('malsha-credentials.pdf'), notes: 'Design diploma.', reviewedById: U.moderator, reviewedAt: daysAgo(130), createdAt: daysAgo(135) },
      { designerId: U.ayesha, status: VerificationStatus.PENDING, evidenceUrl: seedFile('ayesha-credentials.pdf'), notes: 'Diploma and two client references attached.', createdAt: daysAgo(10) },
      { designerId: U.arjun, status: VerificationStatus.PENDING, evidenceUrl: seedFile('arjun-degree.pdf'), notes: 'Graduation certificate.', createdAt: daysAgo(2) },
      { designerId: U.shenali, status: VerificationStatus.REJECTED, evidenceUrl: seedFile('shenali-credentials.jpg'), notes: 'Photo of my certificate.', reviewNotes: 'The photo is too blurry to read. Please upload a clear scan or PDF.', reviewedById: U.admin, reviewedAt: daysAgo(20), createdAt: daysAgo(25) },
    ],
  });

  // Reports in every status and across target types
  const reportedMessage = await prisma.message.findFirstOrThrow({
    where: { projectId: projectId(6), senderId: U.amaya },
  });
  await prisma.report.createMany({
    data: [
      { reporterId: U.nadia, reportedUserId: U.ayesha, targetType: ReportTargetType.USER, targetId: U.ayesha, reason: 'Unsolicited messages outside the platform', details: 'Sample report for moderation testing.', status: ReportStatus.OPEN, createdAt: daysAgo(6) },
      { reporterId: U.ravi, reportedUserId: U.amaya, targetType: ReportTargetType.MESSAGE, targetId: reportedMessage.id, reason: 'Cancellation dispute', details: 'Wants the proposal fee refunded.', status: ReportStatus.UNDER_REVIEW, createdAt: daysAgo(3) },
      { reporterId: U.tharushi, reportedUserId: U.chaminda, targetType: ReportTargetType.PORTFOLIO, targetId: seedId(2, PORTFOLIOS.length), reason: 'Copied my project photos', status: ReportStatus.RESOLVED, resolvedById: U.admin, resolvedAt: daysAgo(15), createdAt: daysAgo(18) },
      { reporterId: U.ravi, reportedUserId: U.kasun, targetType: ReportTargetType.REVIEW, targetId: reviewId(2), reason: 'Review mentions a delay I did not cause', status: ReportStatus.DISMISSED, resolvedById: U.moderator, resolvedAt: daysAgo(35), createdAt: daysAgo(38) },
      { reporterId: U.kasun, reportedUserId: U.ravindu, targetType: ReportTargetType.USER, targetId: U.ravindu, reason: 'Spam', details: 'Sent the same advert to several designers.', status: ReportStatus.RESOLVED, resolvedById: U.moderator, resolvedAt: daysAgo(50), createdAt: daysAgo(52) },
      { reporterId: U.amaya, targetType: ReportTargetType.PROJECT, targetId: projectId(6), reason: 'Designer asked for payment outside Inside', status: ReportStatus.OPEN, createdAt: daysAgo(2) },
    ],
  });

  // Blocks
  await prisma.block.createMany({
    data: [
      { blockerId: U.nadia, blockedId: U.ayesha, reason: 'Sample block for trust and safety testing.' },
      { blockerId: U.kasun, blockedId: U.ravindu, reason: 'Spam messages.' },
    ],
  });

  // Notifications (unread ones have readAt null)
  type NoteSeed = { user: UserKey; type: NotificationType; title: string; message: string; daysAgo: number; read?: boolean; metadata?: Prisma.InputJsonValue };
  const notes: NoteSeed[] = [
    { user: 'nadia', type: NotificationType.STAGE, title: 'Stage submitted', message: 'CONCEPT stage is awaiting your approval', daysAgo: 3, metadata: { projectId: projectId(1) } },
    { user: 'nadia', type: NotificationType.MESSAGE, title: 'New message', message: 'Ravi Designer sent a message on "Living room and kitchen refresh"', daysAgo: 1, metadata: { projectId: projectId(1) } },
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
    { user: 'sam', type: NotificationType.PROPOSAL, title: 'New proposal', message: 'Ravi Designer sent a proposal for "Coastal master bedroom redesign"', daysAgo: 9, read: true },
    { user: 'shenali', type: NotificationType.VERIFICATION, title: 'Verification rejected', message: 'Verification rejected: The photo is too blurry to read. Please upload a clear scan or PDF.', daysAgo: 20 },
    { user: 'shenali', type: NotificationType.PROPOSAL, title: 'Proposal declined', message: 'Your proposal for "Entrance hallway" was declined', daysAgo: 9 },
    { user: 'amaya', type: NotificationType.REQUEST, title: 'Request declined', message: 'Nimal Herath declined your request "Townhouse kitchen"', daysAgo: 18, read: true },
    { user: 'malsha', type: NotificationType.MESSAGE, title: 'New message', message: 'Tharushi Wickramasinghe sent a message on "Kids room refresh"', daysAgo: 1, metadata: { projectId: projectId(7) } },
    { user: 'chaminda', type: NotificationType.SYSTEM, title: 'Account suspended', message: 'Your account was suspended by an administrator', daysAgo: 15 },
  ];
  await prisma.notification.createMany({
    data: notes.map((note) => ({
      userId: U[note.user],
      type: note.type,
      title: note.title,
      message: note.message,
      metadata: note.metadata,
      isRead: Boolean(note.read),
      readAt: note.read ? daysAgo(Math.max(0, note.daysAgo - 0.5)) : null,
      createdAt: daysAgo(note.daysAgo),
    })),
  });

  // Admin audit trail
  await prisma.activityLog.createMany({
    data: [
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
    ],
  });

  // Newsletter
  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: 'client@inside.test', createdAt: daysAgo(100) },
      { email: 'designer3@inside.test', createdAt: daysAgo(90) },
      { email: 'reader.one@example.com', createdAt: daysAgo(12) },
      { email: 'reader.two@example.com', createdAt: daysAgo(3) },
    ],
  });

  await prisma.product.createMany({ data: PRODUCT_SEED });

  console.log('Seed complete.');
  console.log(`All accounts use the password ${SEED_PASSWORD}`);
  for (const user of USERS) {
    console.log(`  ${user.email.padEnd(32)} ${user.role.padEnd(8)} ${user.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
