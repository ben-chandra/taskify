import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, User } from '@prisma/client';

interface JoinProjectPayload {
  projectId: string;
}

function projectRoom(projectId: string): string {
  return `project:${projectId}`;
}

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN ?? '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (!userId) {
      // 'connect_error' is a reserved Socket.IO event name — emitting it
      // manually throws and crashes the gateway. Use a custom event name.
      client.emit('auth_error', { error: 'MISSING_USER_HEADER' });
      client.disconnect(true);
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      client.emit('auth_error', { error: 'UNKNOWN_USER' });
      client.disconnect(true);
      return;
    }

    (client.data as { user: User }).user = user;
  }

  @SubscribeMessage('join:project')
  async onJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinProjectPayload,
  ): Promise<unknown> {
    const project = await this.prisma.project.findUnique({ where: { id: payload.projectId } });
    if (!project) {
      return { error: 'PROJECT_NOT_FOUND' };
    }

    await client.join(projectRoom(payload.projectId));

    const tasks = await this.prisma.task.findMany({
      where: { projectId: payload.projectId },
      orderBy: { createdAt: 'asc' },
    });
    return { tasks };
  }

  @SubscribeMessage('leave:project')
  async onLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinProjectPayload,
  ): Promise<void> {
    // No ownership check: leaving a room this client never joined (or
    // already left) is a harmless no-op (contracts/websocket-events.md).
    await client.leave(projectRoom(payload.projectId));
  }

  emitToProject(projectId: string, event: string, data: unknown): void {
    this.server.to(projectRoom(projectId)).emit(event, data);
  }

  broadcastNotification(params: {
    projectId: string;
    event: string;
    type: NotificationType;
    data: unknown;
  }): void {
    this.logger.debug(`Broadcasting ${params.event} to project ${params.projectId}`);
    this.emitToProject(params.projectId, params.event, params.data);
  }
}
