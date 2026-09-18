import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestStatus, RequestType, Role } from '@inside/database';
import type { AuthUser } from '../auth/auth.service';
import { BlocksService } from '../blocks/blocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';

const requestInclude = {
  brief: { select: { id: true, styles: true, rooms: true } },
  designer: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isVerified: true,
      isAvailable: true,
    },
  },
  client: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { proposals: true } },
} as const;

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  async create(user: AuthUser, dto: CreateRequestDto) {
    if (dto.type === RequestType.DIRECT) {
      if (!dto.designerId) {
        throw new BadRequestException(
          'designerId is required for DIRECT requests',
        );
      }
      if (dto.designerId === user.id) {
        throw new BadRequestException(
          'Cannot send a direct request to yourself',
        );
      }
      const designer = await this.prisma.user.findUnique({
        where: { id: dto.designerId },
      });
      if (!designer || designer.role !== Role.DESIGNER) {
        throw new NotFoundException('Designer not found');
      }
      await this.blocks.assertNotBlocked(user.id, dto.designerId);
    } else if (dto.designerId) {
      throw new BadRequestException(
        'OPEN requests must not include designerId',
      );
    }

    if (dto.briefId) {
      const brief = await this.prisma.brief.findUnique({
        where: { id: dto.briefId },
      });
      if (!brief || brief.clientId !== user.id) {
        throw new NotFoundException('Brief not found');
      }
    }

    const request = await this.prisma.projectRequest.create({
      data: {
        clientId: user.id,
        designerId: dto.type === RequestType.DIRECT ? dto.designerId : null,
        briefId: dto.briefId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status:
          dto.type === RequestType.DIRECT
            ? RequestStatus.PENDING
            : RequestStatus.OPEN,
        budget: dto.budget,
      },
      include: requestInclude,
    });

    return { success: true, data: { request: this.serialize(request) } };
  }

  async listMine(user: AuthUser) {
    const where =
      user.activeRole === Role.CLIENT
        ? { clientId: user.id }
        : {
            OR: [
              { type: RequestType.DIRECT, designerId: user.id },
              {
                type: RequestType.OPEN,
                status: RequestStatus.OPEN,
                clientId: { not: user.id },
              },
            ],
          };

    const items = await this.prisma.projectRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: requestInclude,
    });

    return {
      success: true,
      data: { items: items.map((r) => this.serialize(r)) },
    };
  }

  async getById(user: AuthUser, id: string) {
    const request = await this.requirePartyAccess(id, user);
    return { success: true, data: { request: this.serialize(request) } };
  }

  async cancel(user: AuthUser, id: string) {
    const request = await this.requireOwned(id, user.id);
    if (request.status === RequestStatus.ACCEPTED) {
      throw new BadRequestException('Cannot cancel an accepted request');
    }
    if (
      request.status === RequestStatus.CANCELLED ||
      request.status === RequestStatus.CLOSED
    ) {
      throw new BadRequestException('Request is already closed or cancelled');
    }

    const updated = await this.prisma.projectRequest.update({
      where: { id },
      data: { status: RequestStatus.CANCELLED },
      include: requestInclude,
    });

    return { success: true, data: { request: this.serialize(updated) } };
  }

  async close(user: AuthUser, id: string) {
    const request = await this.requireOwned(id, user.id);
    if (request.type !== RequestType.OPEN) {
      throw new BadRequestException('Only OPEN requests can be closed');
    }
    if (request.status !== RequestStatus.OPEN) {
      throw new BadRequestException('Request is not open for proposals');
    }

    const updated = await this.prisma.projectRequest.update({
      where: { id },
      data: { status: RequestStatus.CLOSED },
      include: requestInclude,
    });

    return { success: true, data: { request: this.serialize(updated) } };
  }

  private async requireOwned(id: string, clientId: string) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.clientId !== clientId) {
      throw new ForbiddenException('You do not own this request');
    }
    return request;
  }

  private async requirePartyAccess(id: string, user: AuthUser) {
    const request = await this.prisma.projectRequest.findUnique({
      where: { id },
      include: requestInclude,
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const isClient = request.clientId === user.id;
    const isAssignedDesigner =
      user.activeRole === Role.DESIGNER && request.designerId === user.id;
    const isOpenForDesigners =
      user.activeRole === Role.DESIGNER &&
      request.type === RequestType.OPEN &&
      request.status === RequestStatus.OPEN;

    if (!isClient && !isAssignedDesigner && !isOpenForDesigners) {
      throw new ForbiddenException('You do not have access to this request');
    }

    return request;
  }

  private serialize(request: {
    id: string;
    clientId: string;
    designerId: string | null;
    briefId: string | null;
    title: string;
    description: string | null;
    type: RequestType;
    status: RequestStatus;
    budget: unknown;
    createdAt: Date;
    updatedAt: Date;
    brief?: {
      id: string;
      styles: string[];
      rooms: string[];
    } | null;
    designer?: {
      id: string;
      name: string;
      avatarUrl: string | null;
      isVerified: boolean;
      isAvailable: boolean;
    } | null;
    client?: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    _count?: { proposals: number };
  }) {
    return {
      id: request.id,
      clientId: request.clientId,
      designerId: request.designerId,
      briefId: request.briefId,
      title: request.title,
      description: request.description,
      type: request.type,
      status: request.status,
      budget: request.budget !== null ? Number(request.budget) : null,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      brief: request.brief ?? null,
      designer: request.designer ?? null,
      client: request.client ?? null,
      proposalCount: request._count?.proposals ?? 0,
    };
  }
}
