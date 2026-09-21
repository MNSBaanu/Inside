import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectStatus, Role, StageStatus } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const prisma = {
    projectStage: { findUnique: jest.fn() },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  const stage = {
    id: 's1',
    status: StageStatus.IN_PROGRESS,
    project: { clientId: 'c1', designerId: 'd1', status: ProjectStatus.ACTIVE },
  };

  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(prisma as unknown as PrismaService);
  });

  it('lists tasks for the client', async () => {
    prisma.projectStage.findUnique.mockResolvedValue(stage);
    prisma.task.findMany.mockResolvedValue([{ id: 't1', title: 'Measure' }]);
    const result = await service.listByStage(client, 's1');
    expect(result.data.items).toHaveLength(1);
  });

  it('designer adds a task', async () => {
    prisma.projectStage.findUnique.mockResolvedValue(stage);
    prisma.task.create.mockResolvedValue({ id: 't1', title: 'Measure' });
    await service.create(designer, 's1', '  Measure  ');
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { stageId: 's1', title: 'Measure' },
    });
  });

  it('rejects task changes by the client', async () => {
    prisma.projectStage.findUnique.mockResolvedValue(stage);
    await expect(
      service.create(client, 's1', 'Measure'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects changes on an approved stage', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: 't1',
      stage: { ...stage, status: StageStatus.APPROVED },
    });
    await expect(service.setDone(designer, 't1', true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
