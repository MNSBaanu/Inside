import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

export const projectRoom = (projectId: string) => `project:${projectId}`;
export const userRoom = (userId: string) => `user:${userId}`;

/** Pushes events to connected browsers. Does nothing until the gateway starts. */
@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  attach(server: Server) {
    this.server = server;
  }

  toProject(projectId: string, event: string, payload: unknown) {
    this.server?.to(projectRoom(projectId)).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }
}
