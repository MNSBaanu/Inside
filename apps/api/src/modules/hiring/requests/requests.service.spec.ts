import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AccountStatus,
  RequestStatus,
  RequestType,
  Role,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { BlocksService } from '../../trust/blocks/blocks.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { PrismaService } from '../../../database/prisma.service';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    brief: { findUnique: jest.fn() },
    projectRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    proposal: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const blocks = {
    assertNotBlocked: jest.fn(),
    listBlockedCounterpartIds: jest.fn().mockResolvedValue(new Set()),
  };
  const notifications = { notify: jest.fn(), notifyMany: jest.fn() };

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

  let service: RequestsService;

  beforeEach(() => {
    jest.clearAllMocks();
    blocks.assertNotBlocked.mockResolvedValue(undefined);
    service = new RequestsService(
      prisma as unknown as PrismaService,
      blocks as unknown as BlocksService,
      notifications as unknown as NotificationsService,
    );
  });

  it('creates OPEN request with OPEN status', async () => {
    prisma.projectRequest.create.mockResolvedValue({
      id: 'r1',
      clientId: 'c1',
      designerId: null,
      briefId: null,
      title: 'Kitchen',
      description: null,
      type: RequestType.OPEN,
      status: RequestStatus.OPEN,
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brief: null,
      designer: null,
      client: { id: 'c1', name: 'Client', avatarUrl: null },
      _count: { proposals: 0 },
    });

    const result = await service.create(client, {
      title: 'Kitchen',
      type: RequestType.OPEN,
    });

    expect(result.data.request.status).toBe(RequestStatus.OPEN);
    expect(prisma.projectRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RequestStatus.OPEN,
          designerId: null,
        }),
      }),
    );
  });

  it('creates DIRECT request with PENDING status', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
      status: AccountStatus.ACTIVE,
      isAvailable: true,
    });
    prisma.projectRequest.create.mockResolvedValue({
      id: 'r2',
      clientId: 'c1',
      designerId: 'd1',
      briefId: null,
      title: 'Bedroom',
      description: null,
      type: RequestType.DIRECT,
      status: RequestStatus.PENDING,
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brief: null,
      designer: {
        id: 'd1',
        name: 'Designer',
        avatarUrl: null,
        isVerified: true,
        isAvailable: true,
      },
      client: { id: 'c1', name: 'Client', avatarUrl: null },
      _count: { proposals: 0 },
    });

    const result = await service.create(client, {
      title: 'Bedroom',
      type: RequestType.DIRECT,
      designerId: 'd1',
    });

    expect(result.data.request.status).toBe(RequestStatus.PENDING);
  });

  it('rejects DIRECT without designerId', async () => {
    await expect(
      service.create(client, {
        title: 'Bedroom',
        type: RequestType.DIRECT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a new direct request to an unavailable designer', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'd1',
      role: Role.DESIGNER,
      status: AccountStatus.ACTIVE,
      isAvailable: false,
    });

    await expect(
      service.create(client, {
        title: 'Bedroom',
        type: RequestType.DIRECT,
        designerId: 'd1',
      }),
    ).rejects.toThrow('This designer is not taking new requests');
    expect(prisma.projectRequest.create).not.toHaveBeenCalled();
  });

  it('lists designer-visible OPEN requests', async () => {
    prisma.projectRequest.findMany.mockResolvedValue([]);

    await service.listMine(designer, {});

    expect(prisma.projectRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { type: RequestType.DIRECT, designerId: 'd1' },
            {
              type: RequestType.OPEN,
              status: RequestStatus.OPEN,
              clientId: { notIn: ['d1'] },
            },
          ],
        },
      }),
    );
  });

  it('closes OPEN request for client owner', async () => {
    prisma.projectRequest.findUnique.mockResolvedValue({
      id: 'r1',
      clientId: 'c1',
      designerId: null,
      briefId: null,
      title: 'Kitchen',
      description: null,
      type: RequestType.OPEN,
      status: RequestStatus.OPEN,
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brief: null,
      designer: null,
      client: { id: 'c1', name: 'Client', avatarUrl: null },
      _count: { proposals: 0 },
    });
    prisma.projectRequest.update.mockResolvedValue({
      id: 'r1',
      clientId: 'c1',
      designerId: null,
      briefId: null,
      title: 'Kitchen',
      description: null,
      type: RequestType.OPEN,
      status: RequestStatus.CLOSED,
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brief: null,
      designer: null,
      client: { id: 'c1', name: 'Client', avatarUrl: null },
      _count: { proposals: 0 },
    });

    prisma.proposal.findMany.mockResolvedValueOnce([{ designerId: 'd2' }]);

    const result = await service.close(client, 'r1');
    expect(result.data.request.status).toBe(RequestStatus.CLOSED);
    expect(notifications.notifyMany).toHaveBeenCalledWith(
      ['d2'],
      expect.objectContaining({
        title: 'Request closed',
        metadata: { requestId: 'r1' },
      }),
    );
  });

  it('notifies the designer when a direct request is cancelled', async () => {
    const base = {
      id: 'r2',
      clientId: 'c1',
      designerId: 'd1',
      briefId: null,
      title: 'Bathroom',
      description: null,
      type: RequestType.DIRECT,
      budget: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      brief: null,
      designer: { id: 'd1', name: 'Designer', avatarUrl: null },
      client: { id: 'c1', name: 'Client', avatarUrl: null },
      _count: { proposals: 0 },
    };
    prisma.projectRequest.findUnique.mockResolvedValue({
      ...base,
      status: RequestStatus.PENDING,
    });
    prisma.projectRequest.update.mockResolvedValue({
      ...base,
      status: RequestStatus.CANCELLED,
    });

    const result = await service.cancel(client, 'r2');
    expect(result.data.request.status).toBe(RequestStatus.CANCELLED);
    expect(notifications.notifyMany).toHaveBeenCalledWith(
      ['d1'],
      expect.objectContaining({
        title: 'Request cancelled',
        metadata: { requestId: 'r2' },
      }),
    );
  });

  it('rejects close on non-existent request', async () => {
    prisma.projectRequest.findUnique.mockResolvedValue(null);

    await expect(service.close(client, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
