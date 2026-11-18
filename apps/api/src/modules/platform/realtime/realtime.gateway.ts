import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../database/prisma.service';
import { AuthService, type JwtPayload } from '../../identity/auth/auth.service';
import { RealtimeService, projectRoom, userRoom } from './realtime.service';

type SocketUser = { id: string; name: string };

const socketData = (socket: Socket) => socket.data as { user?: SocketUser };

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
    server.use((socket, next) => {
      void this.authenticate(socket)
        .then(() => next())
        .catch(() => next(new Error('unauthorized')));
    });
  }

  private async authenticate(socket: Socket) {
    const token = (socket.handshake.auth as { token?: unknown }).token;
    if (typeof token !== 'string' || !token) throw new Error('missing token');
    const payload = await this.jwt.verifyAsync<JwtPayload>(token);
    const user = await this.auth.validateJwtPayload(payload);
    socketData(socket).user = { id: user.id, name: user.name };
    await socket.join(userRoom(user.id));
  }

  @SubscribeMessage('project:join')
  async joinProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { projectId?: unknown },
  ) {
    const { user } = socketData(socket);
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    if (!user || !projectId) return { ok: false };
    const project = await this.prisma.project
      .findUnique({
        where: { id: projectId },
        select: { clientId: true, designerId: true },
      })
      .catch(() => null);
    if (!project || ![project.clientId, project.designerId].includes(user.id)) {
      this.logger.warn(`Refused project room ${projectId} for ${user.id}`);
      return { ok: false };
    }
    await socket.join(projectRoom(projectId));
    return { ok: true };
  }

  @SubscribeMessage('project:leave')
  async leaveProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { projectId?: unknown },
  ) {
    if (typeof body?.projectId === 'string') {
      await socket.leave(projectRoom(body.projectId));
    }
    return { ok: true };
  }

  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { projectId?: unknown },
  ) {
    const { user } = socketData(socket);
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    if (!user || !socket.rooms.has(projectRoom(projectId))) return;
    socket.to(projectRoom(projectId)).emit('typing', {
      projectId,
      userId: user.id,
      name: user.name,
    });
  }
}
