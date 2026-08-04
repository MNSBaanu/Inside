import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectStatus, Role, StageName } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
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
    );
  });

  it('listMine returns designer projects for designer mode', async () => {
    prisma.project.findMany.mockResolvedValue([]);
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
    prisma.project.update.mockResolvedValue({
      ...activeProject,
      status: ProjectStatus.CANCELLED,
    });
    const result = await service.cancel(client, 'p1');
    expect(result.data.project.status).toBe(ProjectStatus.CANCELLED);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'd1' }),
    );
  });

  it('rejects cancel on completed project', async () => {
    prisma.project.findUnique.mockResolvedValue({
      ...activeProject,
      status: ProjectStatus.COMPLETED,
    });
    await expect(service.cancel(client, 'p1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
