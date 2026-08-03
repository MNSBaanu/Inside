import {
  PrismaClient,
  Role,
  RequestType,
  RequestStatus,
  ProposalStatus,
  ProjectStatus,
  StageName,
  StageStatus,
  PaymentStatus,
  VerificationStatus,
  NotificationType,
  AuthTokenType,
  ReportTargetType,
  ReportStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

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

  // Designer can switch activeRole CLIENT ↔ DESIGNER via PATCH /users/me/active-role.
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

  const secondClient = await prisma.user.upsert({
    where: { email: 'client2@inside.test' },
    update: {},
    create: {
      email: 'client2@inside.test',
      passwordHash,
      name: 'Sam Client',
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      isVerified: true,
      location: 'Negombo',
      bio: 'Looking for a coastal bedroom redesign.',
    },
  });

  // Demo auth tokens (hashed); raw values are never stored.
  const emailVerifyHash = hashToken('seed-email-verify-pending-designer');
  const resetHash = hashToken('seed-password-reset-client');

  await prisma.authToken.upsert({
    where: { tokenHash: emailVerifyHash },
    update: {},
    create: {
      userId: pendingDesigner.id,
      tokenHash: emailVerifyHash,
      type: AuthTokenType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.authToken.upsert({
    where: { tokenHash: resetHash },
    update: {},
    create: {
      userId: client.id,
      tokenHash: resetHash,
      type: AuthTokenType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const existingSession = await prisma.session.findFirst({
    where: { userId: client.id, refreshTokenHash: hashToken('seed-client-refresh') },
  });
  if (!existingSession) {
    await prisma.session.create({
      data: {
        userId: client.id,
        refreshTokenHash: hashToken('seed-client-refresh'),
        userAgent: 'SeedBrowser/1.0',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const portfolioSeeds = [
    {
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

  const ayeshaPortfolio = await prisma.portfolio.findFirst({
    where: { designerId: pendingDesigner.id, title: 'Coastal Bedroom Concept' },
  });
  if (!ayeshaPortfolio) {
    await prisma.portfolio.create({
      data: {
        designerId: pendingDesigner.id,
        title: 'Coastal Bedroom Concept',
        description: 'Soft blues and rattan accents for a calm sleep space.',
        style: 'Coastal',
        roomType: 'Bedroom',
        budget: 320000,
        isPublished: true,
        images: {
          create: [
            {
              imageUrl: 'https://picsum.photos/seed/inside-bedroom-1/1200/800',
              caption: 'Headboard wall',
              displayOrder: 0,
            },
          ],
        },
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

  let request = await prisma.projectRequest.findFirst({
    where: { briefId: brief.id, type: RequestType.DIRECT },
  });
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

  const proposalStage = await prisma.projectStage.findUniqueOrThrow({
    where: { projectId_stageOrder: { projectId: project.id, stageOrder: 1 } },
  });
  const paidProposalFee = await prisma.milestonePayment.findFirst({
    where: { projectId: project.id, stageId: proposalStage.id },
  });
  if (!paidProposalFee) {
    await prisma.milestonePayment.create({
      data: {
        projectId: project.id,
        stageId: proposalStage.id,
        amount: 0,
        status: PaymentStatus.RELEASED,
        paidAt: new Date(),
        releasedAt: new Date(),
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

  const approvedVerification = await prisma.verification.findFirst({
    where: { designerId: designer.id, status: VerificationStatus.APPROVED },
  });
  if (!approvedVerification) {
    await prisma.verification.create({
      data: {
        designerId: designer.id,
        status: VerificationStatus.APPROVED,
        evidenceUrl: 'https://example.com/seed/ravi-credentials.pdf',
        notes: 'Approved after portfolio review.',
        reviewedById: admin.id,
        reviewedAt: new Date(),
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

  // Open hiring path: client2 posts open request; two designers propose.
  let openMoodboard = await prisma.moodboard.findFirst({
    where: { clientId: secondClient.id, name: 'Coastal Bedroom' },
  });
  if (!openMoodboard) {
    openMoodboard = await prisma.moodboard.create({
      data: {
        clientId: secondClient.id,
        name: 'Coastal Bedroom',
        savedItems: [{ imageUrl: 'https://picsum.photos/seed/inside-coastal-1/800/600', note: 'Soft blue palette' }],
      },
    });
  }

  let openBrief = await prisma.brief.findFirst({ where: { moodboardId: openMoodboard.id } });
  if (!openBrief) {
    openBrief = await prisma.brief.create({
      data: {
        clientId: secondClient.id,
        moodboardId: openMoodboard.id,
        styles: ['Coastal', 'Scandinavian'],
        rooms: ['Bedroom'],
        budgetRange: '250000-400000',
        description: 'Calm coastal bedroom with better storage and natural light.',
      },
    });
  }

  let openRequest = await prisma.projectRequest.findFirst({
    where: { briefId: openBrief.id, type: RequestType.OPEN },
  });
  if (!openRequest) {
    openRequest = await prisma.projectRequest.create({
      data: {
        clientId: secondClient.id,
        briefId: openBrief.id,
        title: 'Coastal master bedroom redesign',
        description: 'Open request — comparing proposals from available designers.',
        type: RequestType.OPEN,
        status: RequestStatus.OPEN,
        budget: 350000,
      },
    });
  }

  await prisma.proposal.upsert({
    where: { requestId_designerId: { requestId: openRequest.id, designerId: designer.id } },
    update: {},
    create: {
      requestId: openRequest.id,
      designerId: designer.id,
      scope: 'Mood concepts, furniture plan, and shopping list for one bedroom.',
      timeline: '6 weeks',
      stageFees: [
        { name: StageName.PROPOSAL, fee: 0 },
        { name: StageName.CONCEPT, fee: 80000 },
        { name: StageName.DESIGN, fee: 120000 },
        { name: StageName.REVISION, fee: 50000 },
        { name: StageName.COMPLETION, fee: 100000 },
      ],
      totalAmount: 350000,
      status: ProposalStatus.PENDING,
    },
  });

  await prisma.proposal.upsert({
    where: { requestId_designerId: { requestId: openRequest.id, designerId: pendingDesigner.id } },
    update: {},
    create: {
      requestId: openRequest.id,
      designerId: pendingDesigner.id,
      scope: 'Coastal styling package with two concept options and sourcing support.',
      timeline: '5 weeks',
      stageFees: [
        { name: StageName.PROPOSAL, fee: 0 },
        { name: StageName.CONCEPT, fee: 70000 },
        { name: StageName.DESIGN, fee: 110000 },
        { name: StageName.REVISION, fee: 40000 },
        { name: StageName.COMPLETION, fee: 100000 },
      ],
      totalAmount: 320000,
      status: ProposalStatus.PENDING,
    },
  });

  await prisma.notification.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      userId: secondClient.id,
      type: NotificationType.PROPOSAL,
      title: 'New proposal received',
      message: 'Ravi Designer submitted a proposal on your open request.',
      metadata: { requestId: openRequest.id },
    },
  });

  // Completed mini-project for review seed (secondClient + designer) if not present.
  let reviewRequest = await prisma.projectRequest.findFirst({
    where: { clientId: secondClient.id, title: 'Studio nook makeover' },
  });
  if (!reviewRequest) {
    reviewRequest = await prisma.projectRequest.create({
      data: {
        clientId: secondClient.id,
        designerId: designer.id,
        title: 'Studio nook makeover',
        description: 'Small WFH corner — completed seed project for reviews.',
        type: RequestType.DIRECT,
        status: RequestStatus.ACCEPTED,
        budget: 180000,
      },
    });
  }

  const reviewProposal = await prisma.proposal.upsert({
    where: { requestId_designerId: { requestId: reviewRequest.id, designerId: designer.id } },
    update: {},
    create: {
      requestId: reviewRequest.id,
      designerId: designer.id,
      scope: 'Layout plan and furniture sourcing for a work nook.',
      timeline: '4 weeks',
      stageFees: [{ name: StageName.COMPLETION, fee: 180000 }],
      totalAmount: 180000,
      status: ProposalStatus.ACCEPTED,
    },
  });

  const completedProject = await prisma.project.upsert({
    where: { proposalId: reviewProposal.id },
    update: {},
    create: {
      proposalId: reviewProposal.id,
      clientId: secondClient.id,
      designerId: designer.id,
      title: 'Studio nook makeover',
      currentStage: StageName.COMPLETION,
      status: ProjectStatus.COMPLETED,
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.upsert({
    where: { projectId_reviewerId: { projectId: completedProject.id, reviewerId: secondClient.id } },
    update: {},
    create: {
      projectId: completedProject.id,
      reviewerId: secondClient.id,
      designerId: designer.id,
      rating: 5,
      comment: 'Clear communication and a practical layout. Would hire again.',
      isVisible: true,
    },
  });

  const existingReport = await prisma.report.findFirst({
    where: { reporterId: client.id, targetType: ReportTargetType.USER, targetId: pendingDesigner.id },
  });
  if (!existingReport) {
    await prisma.report.create({
      data: {
        reporterId: client.id,
        reportedUserId: pendingDesigner.id,
        targetType: ReportTargetType.USER,
        targetId: pendingDesigner.id,
        reason: 'Unsolicited messages outside platform',
        details: 'Seed moderation sample — not a real complaint.',
        status: ReportStatus.OPEN,
      },
    });
  }

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: client.id, blockedId: pendingDesigner.id } },
    update: {},
    create: {
      blockerId: client.id,
      blockedId: pendingDesigner.id,
      reason: 'Seed sample block for trust & safety demos.',
    },
  });

  console.log('Seed complete.');
  console.log(
    `Admin: ${admin.email} | Client: ${client.email} | Client2: ${secondClient.email} | Designer: ${designer.email} | Pending designer: ${pendingDesigner.email}`,
  );
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
