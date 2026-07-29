import { PrismaClient, Role, RequestType, RequestStatus, ProposalStatus, ProjectStatus, StageName, StageStatus, PaymentStatus, VerificationStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inside.test' },
    update: {},
    create: {
      email: 'admin@inside.test',
      passwordHash,
      name: 'Platform Admin',
      role: Role.ADMIN,
      activeRole: Role.ADMIN,
      isVerified: true,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@inside.test' },
    update: {},
    create: {
      email: 'client@inside.test',
      passwordHash,
      name: 'Nadia Client',
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      isVerified: true,
      location: 'Colombo',
      bio: 'Renovating a two-bedroom apartment.',
    },
  });

  // Dual-role account: registered as DESIGNER, can switch activeRole to CLIENT.
  const designer = await prisma.user.upsert({
    where: { email: 'designer@inside.test' },
    update: {},
    create: {
      email: 'designer@inside.test',
      passwordHash,
      name: 'Ravi Designer',
      role: Role.DESIGNER,
      activeRole: Role.DESIGNER,
      isVerified: true,
      location: 'Kandy',
      bio: 'Minimalist and Scandinavian interiors, 6 years experience.',
    },
  });

  const pendingDesigner = await prisma.user.upsert({
    where: { email: 'designer2@inside.test' },
    update: {},
    create: {
      email: 'designer2@inside.test',
      passwordHash,
      name: 'Ayesha Designer',
      role: Role.DESIGNER,
      activeRole: Role.DESIGNER,
      location: 'Galle',
    },
  });

  const portfolioSeeds = [
    {
      key: 'seed-portfolio-living-room',
      title: 'Scandinavian Living Room',
      description: 'Light oak, neutral palette, layered lighting.',
      style: 'Scandinavian',
      roomType: 'Living Room',
      budget: 450000,
      images: [
        { imageUrl: 'https://picsum.photos/seed/inside-living-1/1200/800', caption: 'Main view', displayOrder: 0 },
        { imageUrl: 'https://picsum.photos/seed/inside-living-2/1200/800', caption: 'Seating detail', displayOrder: 1 },
      ],
    },
    {
      key: 'seed-portfolio-kitchen',
      title: 'Minimalist Kitchen Remodel',
      description: 'Handleless cabinetry with concealed storage.',
      style: 'Minimalist',
      roomType: 'Kitchen',
      budget: 780000,
      images: [
        { imageUrl: 'https://picsum.photos/seed/inside-kitchen-1/1200/800', caption: 'Island', displayOrder: 0 },
      ],
    },
  ];

  for (const seed of portfolioSeeds) {
    const existing = await prisma.portfolio.findFirst({
      where: { designerId: designer.id, title: seed.title },
    });
    if (existing) continue;

    await prisma.portfolio.create({
      data: {
        designerId: designer.id,
        title: seed.title,
        description: seed.description,
        style: seed.style,
        roomType: seed.roomType,
        budget: seed.budget,
        images: { create: seed.images },
      },
    });
  }

  await prisma.favourite.upsert({
    where: { clientId_designerId: { clientId: client.id, designerId: designer.id } },
    update: {},
    create: { clientId: client.id, designerId: designer.id },
  });

  let moodboard = await prisma.moodboard.findFirst({
    where: { clientId: client.id, name: 'Apartment Refresh' },
  });
  if (!moodboard) {
    moodboard = await prisma.moodboard.create({
      data: {
        clientId: client.id,
        name: 'Apartment Refresh',
        savedItems: [
          { imageUrl: 'https://picsum.photos/seed/inside-inspo-1/800/600', note: 'Warm neutrals' },
          { imageUrl: 'https://picsum.photos/seed/inside-inspo-2/800/600', note: 'Open shelving' },
        ],
      },
    });
  }

  let brief = await prisma.brief.findFirst({ where: { moodboardId: moodboard.id } });
  if (!brief) {
    brief = await prisma.brief.create({
      data: {
        clientId: client.id,
        moodboardId: moodboard.id,
        styles: ['Scandinavian', 'Minimalist'],
        rooms: ['Living Room', 'Kitchen'],
        budgetRange: '400000-800000',
        description: 'Refresh living room and kitchen with warm neutral tones and better storage.',
      },
    });
  }

  let request = await prisma.projectRequest.findFirst({ where: { briefId: brief.id } });
  if (!request) {
    request = await prisma.projectRequest.create({
      data: {
        clientId: client.id,
        designerId: designer.id,
        briefId: brief.id,
        title: 'Living room and kitchen refresh',
        description: 'Two rooms, 3 month timeline, budget flexible for quality joinery.',
        type: RequestType.DIRECT,
        status: RequestStatus.ACCEPTED,
        budget: 700000,
      },
    });
  }

  const stageFees = [
    { name: StageName.PROPOSAL, fee: 0 },
    { name: StageName.CONCEPT, fee: 150000 },
    { name: StageName.DESIGN, fee: 250000 },
    { name: StageName.REVISION, fee: 100000 },
    { name: StageName.COMPLETION, fee: 200000 },
  ];

  const proposal = await prisma.proposal.upsert({
    where: { requestId_designerId: { requestId: request.id, designerId: designer.id } },
    update: {},
    create: {
      requestId: request.id,
      designerId: designer.id,
      scope: 'Concept boards, 3D visuals, furniture schedule and site supervision for two rooms.',
      timeline: '12 weeks across five stages',
      stageFees,
      totalAmount: 700000,
      status: ProposalStatus.ACCEPTED,
    },
  });

  const project = await prisma.project.upsert({
    where: { proposalId: proposal.id },
    update: {},
    create: {
      proposalId: proposal.id,
      clientId: client.id,
      designerId: designer.id,
      title: 'Living room and kitchen refresh',
      currentStage: StageName.CONCEPT,
      status: ProjectStatus.ACTIVE,
      startedAt: new Date(),
    },
  });

  for (const [index, stage] of stageFees.entries()) {
    const stageOrder = index + 1;
    const status =
      stageOrder === 1 ? StageStatus.APPROVED : stageOrder === 2 ? StageStatus.SUBMITTED : StageStatus.PENDING;

    await prisma.projectStage.upsert({
      where: { projectId_stageOrder: { projectId: project.id, stageOrder } },
      update: {},
      create: {
        projectId: project.id,
        stageOrder,
        name: stage.name,
        status,
        fee: stage.fee,
        dueDate: new Date(Date.now() + stageOrder * 14 * 24 * 60 * 60 * 1000),
        submittedAt: status === StageStatus.PENDING ? null : new Date(),
        approvedAt: status === StageStatus.APPROVED ? new Date() : null,
      },
    });
  }

  const conceptStage = await prisma.projectStage.findUniqueOrThrow({
    where: { projectId_stageOrder: { projectId: project.id, stageOrder: 2 } },
  });

  await prisma.deliverable.upsert({
    where: { stageId_version: { stageId: conceptStage.id, version: 1 } },
    update: {},
    create: {
      stageId: conceptStage.id,
      version: 1,
      fileUrl: 'https://example.com/seed/concept-board-v1.pdf',
      fileName: 'concept-board-v1.pdf',
      notes: 'Two concept directions for client review.',
    },
  });

  const existingPayment = await prisma.milestonePayment.findFirst({
    where: { projectId: project.id, stageId: conceptStage.id },
  });
  if (!existingPayment) {
    await prisma.milestonePayment.create({
      data: {
        projectId: project.id,
        stageId: conceptStage.id,
        amount: 150000,
        status: PaymentStatus.PENDING,
      },
    });
  }

  const existingMessage = await prisma.message.findFirst({ where: { projectId: project.id } });
  if (!existingMessage) {
    await prisma.message.createMany({
      data: [
        {
          projectId: project.id,
          senderId: designer.id,
          receiverId: client.id,
          content: 'Concept boards uploaded — let me know your preferred direction.',
        },
        {
          projectId: project.id,
          senderId: client.id,
          receiverId: designer.id,
          content: 'Thanks, reviewing them tonight.',
        },
      ],
    });
  }

  const existingNotification = await prisma.notification.findFirst({
    where: { userId: client.id, type: NotificationType.STAGE },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: NotificationType.STAGE,
        title: 'Concept stage submitted',
        message: 'Ravi Designer submitted the Concept stage for your approval.',
        metadata: { projectId: project.id, stageId: conceptStage.id },
      },
    });
  }

  const existingVerification = await prisma.verification.findFirst({
    where: { designerId: pendingDesigner.id },
  });
  if (!existingVerification) {
    await prisma.verification.create({
      data: {
        designerId: pendingDesigner.id,
        status: VerificationStatus.PENDING,
        evidenceUrl: 'https://example.com/seed/designer-credentials.pdf',
        notes: 'Diploma and two client references attached.',
      },
    });
  }

  const existingLog = await prisma.activityLog.findFirst({ where: { projectId: project.id } });
  if (!existingLog) {
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId: designer.id,
        action: 'STAGE_SUBMITTED',
        metadata: { stageOrder: 2, stage: StageName.CONCEPT },
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin: ${admin.email} | Client: ${client.email} | Designer: ${designer.email} | Pending designer: ${pendingDesigner.email}`);
  console.log(`Seed password for all accounts: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
