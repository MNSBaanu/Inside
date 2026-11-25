import { Test } from '@nestjs/testing';
import { ProjectStatus, Role, StageName, WorkLogType } from '@inside/database';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { WorkLogService } from './work-log.service';

describe('WorkLogService', () => {
  const project = {
    id: 'p1',
    title: 'Living room',
    clientId: 'c1',
    designerId: 'd1',
    status: ProjectStatus.ACTIVE,
    currentStage: StageName.PROPOSAL,
  };
  const entry = {
    id: 'w1',
    projectId: 'p1',
    stageId: 's1',
    authorId: 'd1',
    type: WorkLogType.SITE_VISIT,
    title: 'Site visit',
    note: null,
    photos: [],
    happenedAt: new Date(),
    confirmedAt: null,
    confirmedById: null,
    createdAt: new Date(),
  };
  const withAuthor = {
    ...entry,
    author: { id: 'd1', name: 'Ravi', avatarUrl: null },
    stage: { name: StageName.PROPOSAL },
  };

  const prisma = {
    project: { findUnique: jest.fn().mockResolvedValue(project) },
    projectStage: { findFirst: jest.fn().mockResolvedValue({ id: 's1' }) },
    workLog: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue(withAuthor),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };

  const designer = { id: 'd1', name: 'Ravi', role: Role.DESIGNER };
  const client = { id: 'c1', name: 'Nadia', role: Role.CLIENT };

  let service: WorkLogService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkLogService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
        { provide: ActivityService, useValue: activity },
      ],
    }).compile();
    service = moduleRef.get(WorkLogService);
  });

  it('logs work on the current stage and asks the other party to confirm', async () => {
    await service.create(designer as never, 'p1', {
      type: WorkLogType.SITE_VISIT,
      title: 'Site visit',
      happenedAt: new Date(Date.now() - 60_000),
    });
    expect(prisma.workLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ stageId: 's1', authorId: 'd1' }),
      }),
    );
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'c1' }),
    );
  });

  it('rejects work dated in the future', async () => {
    await expect(
      service.create(designer as never, 'p1', {
        type: WorkLogType.INSTALLATION,
        title: 'Installation',
        happenedAt: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toThrow('Log work that has already happened');
  });

  it('only the other party can confirm an entry', async () => {
    prisma.workLog.findUnique.mockResolvedValue(entry);
    await expect(service.confirm(designer as never, 'w1')).rejects.toThrow(
      'The other party confirms this entry',
    );

    prisma.workLog.update.mockResolvedValue({
      ...withAuthor,
      confirmedAt: new Date(),
      confirmedById: 'c1',
    });
    const result = await service.confirm(client as never, 'w1');
    expect(result.data.entry.confirmedById).toBe('c1');
  });

  it('confirmed entries cannot be deleted', async () => {
    prisma.workLog.findUnique.mockResolvedValue({
      ...entry,
      confirmedAt: new Date(),
    });
    await expect(service.remove(designer as never, 'w1')).rejects.toThrow(
      'Confirmed entries cannot be deleted',
    );
  });
});
