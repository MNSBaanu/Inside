import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectStatus, Role, StageName, StageStatus } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverablesService } from './deliverables.service';

describe('DeliverablesService', () => {
  const prisma = {
    projectStage: { findUnique: jest.fn() },
    deliverable: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };

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

  const stage = {
    id: 's1',
    projectId: 'p1',
    stageOrder: 1,
    name: StageName.PROPOSAL,
    status: StageStatus.IN_PROGRESS,
    project: {
      id: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Sofa',
      status: ProjectStatus.ACTIVE,
    },
  };

  let service: DeliverablesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeliverablesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      activity as unknown as ActivityService,
    );
  });

  it('designer uploads a deliverable, auto-incrementing version', async () => {
    prisma.projectStage.findUnique.mockResolvedValue(stage);
    prisma.deliverable.findFirst.mockResolvedValue({ version: 2 });
    prisma.deliverable.create.mockResolvedValue({
      id: 'del1',
      stageId: 's1',
      version: 3,
      fileUrl: 'x',
      fileName: null,
      notes: null,
      feedback: null,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create(designer, 's1', { fileUrl: 'x' });
    expect(result.data.deliverable.version).toBe(3);
    expect(prisma.deliverable.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: 3 }),
      }),
    );
  });

  it('rejects upload by non-designer', async () => {
    prisma.projectStage.findUnique.mockResolvedValue(stage);
    await expect(
      service.create(client, 's1', { fileUrl: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects upload on non-active stage', async () => {
    prisma.projectStage.findUnique.mockResolvedValue({
      ...stage,
      status: StageStatus.APPROVED,
    });
    await expect(
      service.create(designer, 's1', { fileUrl: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
