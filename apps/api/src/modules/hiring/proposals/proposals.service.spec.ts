import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  AccountStatus,
  Prisma,
  ProposalStatus,
  ProjectStatus,
  RequestStatus,
  RequestType,
  Role,
  StageName,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { ProposalsService } from './proposals.service';

describe('ProposalsService', () => {
  const tx = {
    proposal: {
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    projectRequest: { updateMany: jest.fn() },
    project: { create: jest.fn() },
  };

  const prisma = {
    projectRequest: { findUnique: jest.fn() },
    proposal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

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

  let service: ProposalsService;

  const notifications = { notify: jest.fn() };
  const activity = { log: jest.fn() };
  const blocks = { assertNotBlocked: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProposalsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      activity as unknown as ActivityService,
      blocks as unknown as BlocksService,
    );
  });

  it('creates proposal with summed totalAmount', async () => {
    prisma.projectRequest.findUnique.mockResolvedValue({
      id: 'r1',
      type: RequestType.OPEN,
      status: RequestStatus.OPEN,
      designerId: null,
    });
    prisma.proposal.create.mockResolvedValue({
      id: 'p1',
      requestId: 'r1',
      designerId: 'd1',
      scope: 'Full design',
      timeline: '8 weeks',
      stageFees: [{ name: StageName.PROPOSAL, fee: 50000 }],
      totalAmount: 50000,
      status: ProposalStatus.PENDING,
      submittedAt: new Date(),
      updatedAt: new Date(),
      designer: {
        id: 'd1',
        name: 'Designer',
        avatarUrl: null,
        isVerified: true,
        isAvailable: true,
      },
    });

    const result = await service.create(designer, 'r1', {
      scope: 'Full design',
      timeline: '8 weeks',
      stageFees: [
        { name: StageName.PROPOSAL, fee: 20000 },
        { name: StageName.CONCEPT, fee: 30000 },
      ],
    });

    expect(result.data.proposal.totalAmount).toBe(50000);
    expect(prisma.proposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: 50000 }),
      }),
    );
  });

  it('maps duplicate proposal to ConflictException', async () => {
    prisma.projectRequest.findUnique.mockResolvedValue({
      id: 'r1',
      type: RequestType.OPEN,
      status: RequestStatus.OPEN,
      designerId: null,
    });
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.proposal.create.mockRejectedValue(err);

    await expect(
      service.create(designer, 'r1', {
        scope: 'Scope',
        timeline: '4 weeks',
        stageFees: [{ name: StageName.PROPOSAL, fee: 10000 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects proposal on closed request', async () => {
    prisma.projectRequest.findUnique.mockResolvedValue({
      id: 'r1',
      type: RequestType.OPEN,
      status: RequestStatus.CLOSED,
      designerId: null,
    });

    await expect(
      service.create(designer, 'r1', {
        scope: 'Scope',
        timeline: '4 weeks',
        stageFees: [{ name: StageName.PROPOSAL, fee: 10000 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts proposal and creates project with 5 stages', async () => {
    const stageFees = [
      { name: StageName.PROPOSAL, fee: 10000 },
      { name: StageName.CONCEPT, fee: 20000 },
      { name: StageName.DESIGN, fee: 30000 },
      { name: StageName.REVISION, fee: 15000 },
      { name: StageName.COMPLETION, fee: 25000 },
    ];

    prisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      requestId: 'r1',
      designerId: 'd1',
      stageFees,
      request: {
        id: 'r1',
        clientId: 'c1',
        title: 'Living room',
        status: RequestStatus.OPEN,
      },
      designer: { status: AccountStatus.ACTIVE },
      status: ProposalStatus.PENDING,
    });

    tx.proposal.updateMany.mockResolvedValue({ count: 1 });
    tx.projectRequest.updateMany.mockResolvedValue({ count: 1 });
    tx.project.create.mockResolvedValue({
      id: 'proj1',
      proposalId: 'p1',
      clientId: 'c1',
      designerId: 'd1',
      title: 'Living room',
      currentStage: StageName.PROPOSAL,
      status: ProjectStatus.ACTIVE,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: stageFees.map((s, i) => ({
        id: `s${i}`,
        stageOrder: i + 1,
        name: s.name,
        status: 'PENDING',
        fee: s.fee,
        dueDate: null,
      })),
    });

    const result = await service.accept(client, 'p1');

    expect(result.data.project.stages).toHaveLength(5);
    expect(tx.proposal.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', status: ProposalStatus.PENDING },
      data: { status: ProposalStatus.ACCEPTED },
    });
    expect(tx.projectRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'r1',
        status: { in: [RequestStatus.OPEN, RequestStatus.PENDING] },
      },
      data: {
        status: RequestStatus.ACCEPTED,
        designerId: 'd1',
      },
    });
  });

  it('rejects accept from non-owner client', async () => {
    prisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      requestId: 'r1',
      designerId: 'd1',
      stageFees: [],
      request: {
        id: 'r1',
        clientId: 'other',
        title: 'Room',
        status: RequestStatus.OPEN,
      },
      status: ProposalStatus.PENDING,
    });

    await expect(service.accept(client, 'p1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
