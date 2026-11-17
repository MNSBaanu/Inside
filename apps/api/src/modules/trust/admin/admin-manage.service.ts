import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  ProjectStatus,
  RequestStatus,
  RequestType,
  type Product,
} from '@inside/database';
import type { AuthUser } from '../../identity/auth/auth.service';
import { ActivityService } from '../../platform/activity/activity.service';
import { NotificationsService } from '../../platform/notifications/notifications.service';
import { paginate } from '../../../common/dto/pagination-query.dto';
import { PrismaService } from '../../../database/prisma.service';
import type {
  AdminCreateProductDto,
  AdminOpenRequestsQueryDto,
  AdminProductsQueryDto,
  AdminProjectsQueryDto,
  AdminSetRequestStatusDto,
  AdminUpdateProductDto,
} from './dto/admin-manage.dto';

const person = { select: { id: true, name: true, avatarUrl: true } };

function contains(value: string) {
  return { contains: value, mode: 'insensitive' as const };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

@Injectable()
export class AdminManageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  // Projects

  async listProjects(query: AdminProjectsQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const search = query.search?.trim();
    const where: Prisma.ProjectWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.stage ? { currentStage: query.stage } : {}),
      ...(search
        ? {
            OR: [
              { title: contains(search) },
              { client: { name: contains(search) } },
              { designer: { name: contains(search) } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          title: true,
          status: true,
          currentStage: true,
          createdAt: true,
          client: person,
          designer: person,
          proposal: { select: { totalAmount: true } },
        },
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.map(({ proposal, ...project }) => ({
          ...project,
          totalAmount:
            proposal.totalAmount === null ? null : Number(proposal.totalAmount),
        })),
        page,
        pageSize,
        total,
      },
    };
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        designer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        proposal: {
          select: { totalAmount: true, timeline: true, scope: true },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          select: {
            id: true,
            name: true,
            status: true,
            fee: true,
            dueDate: true,
            approvedAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            stageId: true,
            amount: true,
            status: true,
            paidAt: true,
            releasedAt: true,
          },
        },
        _count: { select: { messages: true, reviews: true } },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const { proposal, stages, payments, ...rest } = project;
    return {
      success: true,
      data: {
        project: {
          ...rest,
          totalAmount:
            proposal.totalAmount === null ? null : Number(proposal.totalAmount),
          timeline: proposal.timeline,
          scope: proposal.scope,
          stages: stages.map((stage) => ({
            ...stage,
            fee: stage.fee === null ? null : Number(stage.fee),
          })),
          payments: payments.map((payment) => ({
            ...payment,
            amount: Number(payment.amount),
          })),
        },
      },
    };
  }

  async holdProject(admin: AuthUser, id: string) {
    const project = await this.requireProject(id);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException('Only active projects can be put on hold');
    }
    return this.changeProjectStatus(admin, project, ProjectStatus.ON_HOLD, {
      action: 'PROJECT_ON_HOLD',
      title: 'Project on hold',
      message: `An administrator placed "${project.title}" on hold`,
    });
  }

  async resumeProject(admin: AuthUser, id: string) {
    const project = await this.requireProject(id);
    if (project.status !== ProjectStatus.ON_HOLD) {
      throw new BadRequestException('Only on-hold projects can be resumed');
    }
    return this.changeProjectStatus(admin, project, ProjectStatus.ACTIVE, {
      action: 'PROJECT_RESUMED',
      title: 'Project resumed',
      message: `An administrator made "${project.title}" active again`,
    });
  }

  async cancelProject(admin: AuthUser, id: string, reason: string) {
    const project = await this.requireProject(id);
    if (
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException('Project is already closed');
    }
    return this.changeProjectStatus(admin, project, ProjectStatus.CANCELLED, {
      action: 'PROJECT_CANCELLED',
      title: 'Project cancelled',
      message: `An administrator cancelled "${project.title}": ${reason}`,
      metadata: { reason },
    });
  }

  private async requireProject(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async changeProjectStatus(
    admin: AuthUser,
    project: { id: string; clientId: string; designerId: string },
    status: ProjectStatus,
    event: {
      action: string;
      title: string;
      message: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.prisma.project.update({
      where: { id: project.id },
      data: { status },
    });
    for (const userId of [project.clientId, project.designerId]) {
      await this.notifications.notify({
        userId,
        type: NotificationType.PROJECT,
        title: event.title,
        message: event.message,
        metadata: { projectId: project.id },
      });
    }
    await this.activity.log({
      projectId: project.id,
      userId: admin.id,
      action: event.action,
      metadata: { ...event.metadata, byAdmin: true },
    });
    return { success: true, data: { project: { id: project.id, status } } };
  }

  // Shop items

  async listProducts(query: AdminProductsQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const search = query.search?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(query.category
        ? { category: { equals: query.category, mode: 'insensitive' } }
        : {}),
      ...(query.seller
        ? { sellerName: { equals: query.seller, mode: 'insensitive' } }
        : {}),
      ...(query.visibility
        ? { isPublished: query.visibility === 'published' }
        : {}),
      ...(search
        ? {
            OR: [
              { name: contains(search) },
              { sellerName: contains(search) },
              { category: contains(search) },
            ],
          }
        : {}),
    };
    const [total, items, categories, sellers] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.product.findMany({
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
      this.prisma.product.findMany({
        distinct: ['sellerName'],
        select: { sellerName: true },
        orderBy: { sellerName: 'asc' },
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.map((product) => this.serializeProduct(product)),
        page,
        pageSize,
        total,
        categories: categories.map((row) => row.category),
        sellers: sellers.map((row) => row.sellerName),
      },
    };
  }

  async createProduct(admin: AuthUser, dto: AdminCreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
        category: dto.category.trim(),
        style: dto.style?.trim() || null,
        price: dto.price,
        imageUrl: dto.imageUrl,
        sellerName: dto.sellerName.trim(),
        sellerUrl: dto.sellerUrl,
        isPublished: dto.isPublished ?? true,
        slug: await this.uniqueSlug(dto.name),
      },
    });
    await this.activity.log({
      userId: admin.id,
      action: 'PRODUCT_CREATED',
      metadata: { productId: product.id, name: product.name },
    });
    return { success: true, data: { product: this.serializeProduct(product) } };
  }

  async updateProduct(admin: AuthUser, id: string, dto: AdminUpdateProductDto) {
    await this.requireProduct(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: this.productData(dto),
    });
    await this.activity.log({
      userId: admin.id,
      action: 'PRODUCT_UPDATED',
      metadata: { productId: id, name: product.name },
    });
    return { success: true, data: { product: this.serializeProduct(product) } };
  }

  async deleteProduct(admin: AuthUser, id: string) {
    const product = await this.requireProduct(id);
    await this.prisma.product.delete({ where: { id } });
    await this.activity.log({
      userId: admin.id,
      action: 'PRODUCT_DELETED',
      metadata: { productId: id, name: product.name },
    });
    return { success: true, data: { deleted: true } };
  }

  private productData(dto: AdminUpdateProductDto): Prisma.ProductUpdateInput {
    return {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description.trim() }
        : {}),
      ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
      ...(dto.style !== undefined ? { style: dto.style.trim() || null } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.sellerName !== undefined
        ? { sellerName: dto.sellerName.trim() }
        : {}),
      ...(dto.sellerUrl !== undefined ? { sellerUrl: dto.sellerUrl } : {}),
      ...(dto.isPublished !== undefined
        ? { isPublished: dto.isPublished }
        : {}),
    };
  }

  private async requireProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async uniqueSlug(name: string) {
    const base = slugify(name);
    const taken = await this.prisma.product.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const used = new Set(taken.map((row) => row.slug));
    if (!used.has(base)) return base;
    let n = 2;
    while (used.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  private serializeProduct(product: Product) {
    return { ...product, price: Number(product.price) };
  }

  // Open projects

  async listOpenRequests(query: AdminOpenRequestsQueryDto) {
    const { page, pageSize, skip, take } = paginate(query, 20);
    const search = query.search?.trim();
    const where: Prisma.ProjectRequestWhereInput = {
      type: RequestType.OPEN,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { title: contains(search) },
              { description: contains(search) },
              { client: { name: contains(search) } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.projectRequest.count({ where }),
      this.prisma.projectRequest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          timeline: true,
          budget: true,
          status: true,
          createdAt: true,
          client: person,
          _count: { select: { proposals: true } },
        },
      }),
    ]);
    return {
      success: true,
      data: {
        items: items.map(({ _count, ...request }) => ({
          ...request,
          budget: request.budget === null ? null : Number(request.budget),
          proposals: _count.proposals,
        })),
        page,
        pageSize,
        total,
      },
    };
  }

  async setOpenRequestStatus(
    admin: AuthUser,
    id: string,
    dto: AdminSetRequestStatusDto,
  ) {
    const request = await this.prisma.projectRequest.findFirst({
      where: { id, type: RequestType.OPEN },
    });
    if (!request) {
      throw new NotFoundException('Open project not found');
    }
    if (request.status === RequestStatus.ACCEPTED) {
      throw new BadRequestException(
        'This open project already became a project',
      );
    }
    if (request.status === dto.status) {
      throw new BadRequestException('Open project already has that status');
    }
    await this.prisma.projectRequest.update({
      where: { id },
      data: { status: dto.status },
    });

    const messages: Record<AdminSetRequestStatusDto['status'], string> = {
      OPEN: `An administrator reopened "${request.title}"`,
      CLOSED: `An administrator closed "${request.title}" to new proposals`,
      CANCELLED: `An administrator removed "${request.title}" from open projects`,
    };
    await this.notifications.notify({
      userId: request.clientId,
      type: NotificationType.REQUEST,
      title: 'Open project updated',
      message: messages[dto.status],
      metadata: { requestId: id },
    });
    await this.activity.log({
      userId: admin.id,
      action: `OPEN_PROJECT_${dto.status}`,
      metadata: { requestId: id, title: request.title },
    });
    return { success: true, data: { request: { id, status: dto.status } } };
  }
}
