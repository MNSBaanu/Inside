import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectStatus, Role, StageName, StageStatus } from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { PaymentsService } from '../payments/payments.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    milestonePayment: { findFirst: jest.fn() },
    message: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };

  const client = {
    id: 'c1',
    role: Role.CLIENT,
    activeRole: Role.CLIENT,
  } as AuthUser;

  const designer = {
    id: 'd1',
    role: Role.DESIGNER,
    activeRole: Role.DESIGNER,
  } as AuthUser;

  const stranger = { id: 'x1', role: Role.CLIENT } as AuthUser;

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn(), listByProject: jest.fn() };

  const payments = {
    cancelAndRefund: jest.fn().mockResolvedValue({ refunded: 0, failed: 0 }),
  };

  let service: ProjectsService;

  const activeProject = {
    id: 'p1',
    proposalId: 'pr1',
    clientId: 'c1',
    designerId: 'd1',
    title: 'Sofa',
    currentStage: StageName.PROPOSAL,
    status: ProjectStatus.ACTIVE,
    startedAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    stages: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      activity as unknown as ActivityService,
      payments as unknown as PaymentsService,
    );
    prisma.milestonePayment.findFirst.mockResolvedValue(null);
  });

  it('listMine returns designer projects for designer mode', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.message.groupBy.mockResolvedValue([]);
    prisma.message.findMany.mockResolvedValue([]);
    await service.listMine(designer);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { designerId: 'd1' } }),
    );
  });

  it('forbids non-party from getById', async () => {
    prisma.project.findUnique.mockResolvedValue(activeProject);
    await expect(service.getById(stranger, 'p1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('cancel updates status and notifies the other party', async () => {
    prisma.project.findUnique.mockResolvedValue(activeProject);
    prisma.project.findUniqueOrThrow.mockResolvedValue({
      ...activeProject,
      status: ProjectStatus.CANCELLED,
    });
    const result = await service.cancel(client, 'p1', 'Budget changed');
    expect(payments.cancelAndRefund).toHaveBeenCalledWith('p1');
    expect(result.data.project.status).toBe(ProjectStatus.CANCELLED);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'd1' }),
    );
  });

  it('stops a client cancelling while a paid stage is under way', async () => {
    prisma.project.findUnique.mockResolvedValue(activeProject);
    prisma.milestonePayment.findFirst.mockResolvedValue({
      stage: { name: StageName.DESIGN, status: StageStatus.SUBMITTED },
    });
    await expect(service.cancel(client, 'p1', 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(payments.cancelAndRefund).not.toHaveBeenCalled();
  });

  it('lets the designer cancel and refund a stage under way', async () => {
    prisma.project.findUnique.mockResolvedValue(activeProject);
    prisma.project.findUniqueOrThrow.mockResolvedValue({
      ...activeProject,
      status: ProjectStatus.CANCELLED,
    });
    await service.cancel(designer, 'p1', 'Cannot continue');
    expect(prisma.milestonePayment.findFirst).not.toHaveBeenCalled();
    expect(payments.cancelAndRefund).toHaveBeenCalledWith('p1');
  });

  it('rejects cancel on completed project', async () => {
    prisma.project.findUnique.mockResolvedValue({
      ...activeProject,
      status: ProjectStatus.COMPLETED,
    });
    await expect(service.cancel(client, 'p1', 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
