import { PrismaClient, Role, RequestType, RequestStatus, ProposalStatus, ProjectStatus, StageName, StageStatus, PaymentStatus, VerificationStatus, NotificationType } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
];

async function main() {
  console.log("Seeding database...");

  await prisma.activityLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.block.deleteMany();
  await prisma.report.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.milestonePayment.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.project.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.projectRequest.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.moodboard.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashSync("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@inside.local",
      passwordHash,
      name: "Inside Admin",
      role: Role.ADMIN,
      activeRole: Role.ADMIN,
      isVerified: true,
      bio: "Platform administrator",
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "client@inside.local",
      passwordHash,
      name: "Ava Chen",
      role: Role.CLIENT,
      activeRole: Role.CLIENT,
      isVerified: true,
      bio: "Homeowner looking to refresh a living room and kitchen.",
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: "designer@inside.local",
      passwordHash,
      name: "Jordan Miles",
      role: Role.DESIGNER,
      activeRole: Role.DESIGNER,
      isVerified: true,
      isAvailable: true,
      bio: "Modern and Japandi interior designer based in Singapore.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
  });

  const portfolioLiving = await prisma.portfolio.create({
    data: {
      title: "Serene Living Room Retreat",
      description: "Soft neutrals, layered textiles, and warm wood accents.",
      images: [PLACEHOLDER_IMAGES[0], PLACEHOLDER_IMAGES[1]],
      style: ["modern", "japandi"],
      roomType: ["living"],
      budget: 12000,
      designerId: designer.id,
    },
  });

  const portfolioKitchen = await prisma.portfolio.create({
    data: {
      title: "Open-Plan Kitchen Refresh",
      description: "Clean lines, stone counters, and integrated storage.",
      images: [PLACEHOLDER_IMAGES[2], PLACEHOLDER_IMAGES[0]],
      style: ["modern", "minimal"],
      roomType: ["kitchen"],
      budget: 18000,
      designerId: designer.id,
    },
  });

  await prisma.favourite.create({
    data: {
      clientId: client.id,
      designerId: designer.id,
    },
  });

  const moodboard = await prisma.moodboard.create({
    data: {
      name: "Warm Modern Living",
      clientId: client.id,
      savedItems: [
        { url: PLACEHOLDER_IMAGES[0], note: "Neutral sofa" },
        { url: PLACEHOLDER_IMAGES[1], note: "Wood accent wall" },
      ],
    },
  });

  const brief = await prisma.brief.create({
    data: {
      styles: ["modern", "japandi"],
      rooms: ["living"],
      budgetMin: 8000,
      budgetMax: 15000,
      description: "Refresh living room with calm neutrals and better lighting.",
      moodboardId: moodboard.id,
    },
  });

  const request = await prisma.projectRequest.create({
    data: {
      type: RequestType.DIRECT,
      status: RequestStatus.HIRED,
      budget: 12000,
      title: "Living room redesign",
      notes: "Prefer soft textures and good natural light.",
      clientId: client.id,
      briefId: brief.id,
      designerId: designer.id,
    },
  });

  const proposal = await prisma.proposal.create({
    data: {
      scope: "Full living room concept through completion with 5 staged milestones.",
      timeline: "8 weeks",
      stageFees: {
        PROPOSAL: 500,
        CONCEPT: 1500,
        DESIGN: 4000,
        REVISION: 2000,
        COMPLETION: 2000,
      },
      totalAmount: 10000,
      status: ProposalStatus.ACCEPTED,
      message: "Happy to take this on — proposing a calm Japandi-modern scheme.",
      requestId: request.id,
      designerId: designer.id,
    },
  });

  const project = await prisma.project.create({
    data: {
      title: "Ava × Jordan — Living Room",
      currentStage: StageName.CONCEPT,
      status: ProjectStatus.ACTIVE,
      proposalId: proposal.id,
      clientId: client.id,
      designerId: designer.id,
    },
  });

  const stageDefs: { name: StageName; order: number; status: StageStatus; fee: number }[] = [
    { name: StageName.PROPOSAL, order: 1, status: StageStatus.APPROVED, fee: 500 },
    { name: StageName.CONCEPT, order: 2, status: StageStatus.IN_REVIEW, fee: 1500 },
    { name: StageName.DESIGN, order: 3, status: StageStatus.PENDING, fee: 4000 },
    { name: StageName.REVISION, order: 4, status: StageStatus.PENDING, fee: 2000 },
    { name: StageName.COMPLETION, order: 5, status: StageStatus.PENDING, fee: 2000 },
  ];

  for (const stage of stageDefs) {
    const created = await prisma.projectStage.create({
      data: {
        stageOrder: stage.order,
        name: stage.name,
        status: stage.status,
        fee: stage.fee,
        dueDate: new Date(Date.now() + stage.order * 7 * 24 * 60 * 60 * 1000),
        projectId: project.id,
      },
    });

    await prisma.milestonePayment.create({
      data: {
        amount: stage.fee,
        status:
          stage.status === StageStatus.APPROVED
            ? PaymentStatus.RELEASED
            : stage.status === StageStatus.IN_REVIEW
              ? PaymentStatus.AUTHORIZED
              : PaymentStatus.PENDING,
        stageId: created.id,
        projectId: project.id,
        releasedAt: stage.status === StageStatus.APPROVED ? new Date() : null,
      },
    });

    if (stage.name === StageName.CONCEPT) {
      await prisma.deliverable.create({
        data: {
          version: 1,
          fileUrl: PLACEHOLDER_IMAGES[1],
          title: "Concept board v1",
          stageId: created.id,
        },
      });
    }
  }

  await prisma.notification.create({
    data: {
      type: NotificationType.STAGE_SUBMITTED,
      title: "Concept ready for review",
      body: "Jordan submitted Concept stage deliverables for your living room project.",
      userId: client.id,
      metadata: { projectId: project.id },
    },
  });

  await prisma.verification.create({
    data: {
      status: VerificationStatus.PENDING,
      evidenceUrl: "https://example.com/credentials/jordan-miles.pdf",
      notes: "Portfolio and trade licence attached.",
      userId: designer.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "PROJECT_CREATED",
      metadata: { proposalId: proposal.id },
      projectId: project.id,
      userId: client.id,
    },
  });

  console.log("Seed complete:");
  console.log({
    admin: admin.email,
    client: client.email,
    designer: designer.email,
    portfolios: [portfolioLiving.title, portfolioKitchen.title],
    project: project.title,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
