import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PaymentStatus,
  ProjectStatus,
  Role,
  StageName,
  StageStatus,
} from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StagesService } from './stages.service';

describe('StagesService', () => {
  const tx = {
    projectStage: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    milestonePayment: { create: jest.fn() },
    project: { update: jest.fn() },
  };

  const prisma = {
    projectStage: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const notifications = { notify: jest.fn() };

  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const baseStage = {
    id: 's1',
    projectId: 'p1',
    stageOrder: 1,
    name: StageName.PROPOSAL,
    fee: 50000,
    dueDate: null,
    submittedAt: null,
    approvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {
      id: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Sofa',
      currentStage: StageName.PROPOSAL,
      status: ProjectStatus.ACTIVE,
    },
  };

  let service: StagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StagesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('designer starts a pending stage', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.PENDING,
    });
    prisma.projectStage.update.mockResolvedValue({
      ...baseStage,
      status: StageStatus.IN_PROGRESS,
    });

    const result = await service.start(designer, 's1');
    expect(result.data.stage.status).toBe(StageStatus.IN_PROGRESS);
  });

  it('rejects start by non-designer', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.PENDING,
    });
    await expect(service.start(client, 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects start when stage is not pending', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.IN_PROGRESS,
    });
    await expect(service.start(designer, 's1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('designer submits an in-progress stage', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.IN_PROGRESS,
    });
    prisma.projectStage.update.mockResolvedValue({
      ...baseStage,
      status: StageStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    const result = await service.submit(designer, 's1');
    expect(result.data.stage.status).toBe(StageStatus.SUBMITTED);
  });

  it('client approves submitted stage, creates payment, advances next stage', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.SUBMITTED,
    });
    tx.projectStage.update.mockResolvedValueOnce({
      ...baseStage,
      status: StageStatus.APPROVED,
      approvedAt: new Date(),
    });
    tx.projectStage.findFirst.mockResolvedValue({
      id: 's2',
      stageOrder: 2,
      name: StageName.CONCEPT,
    });
    tx.projectStage.update.mockResolvedValueOnce({});
    tx.project.update.mockResolvedValue({});

    const result = await service.approve(client, 's1');
    expect(result.data.stage.status).toBe(StageStatus.APPROVED);
    expect(tx.milestonePayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 50000,
          status: PaymentStatus.PENDING,
        }),
      }),
    );
    expect(tx.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { currentStage: StageName.CONCEPT },
      }),
    );
  });

  it('client approves last stage completes project', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      stageOrder: 5,
      name: StageName.COMPLETION,
      status: StageStatus.SUBMITTED,
      project: {
        ...baseStage.project,
        currentStage: StageName.COMPLETION,
      },
    });
    tx.projectStage.update.mockResolvedValueOnce({
      ...baseStage,
      status: StageStatus.APPROVED,
      approvedAt: new Date(),
    });
    tx.projectStage.findFirst.mockResolvedValue(null);
    tx.project.update.mockResolvedValue({});

    await service.approve(client, 's1');
    expect(tx.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ProjectStatus.COMPLETED,
        }),
      }),
    );
  });

  it('client rejects submitted stage', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...baseStage,
      status: StageStatus.SUBMITTED,
    });
    prisma.projectStage.update.mockResolvedValue({
      ...baseStage,
      status: StageStatus.REJECTED,
    });

    const result = await service.reject(client, 's1', 'try again');
    expect(result.data.stage.status).toBe(StageStatus.REJECTED);
  });
});
