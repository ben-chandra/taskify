import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

interface RecordAndBroadcastParams {
  projectId: string;
  type: NotificationType;
  actingUserId: string;
  payload: Prisma.InputJsonValue;
  event: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async recordAndBroadcast(params: RecordAndBroadcastParams): Promise<void> {
    await this.prisma.notification.create({
      data: {
        projectId: params.projectId,
        type: params.type,
        actingUserId: params.actingUserId,
        payload: params.payload,
      },
    });

    this.realtime.broadcastNotification({
      projectId: params.projectId,
      event: params.event,
      type: params.type,
      data: params.payload,
    });
  }

  async catchUp(projectId: string, since?: string): Promise<unknown[]> {
    return this.prisma.notification.findMany({
      where: {
        projectId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: since ? undefined : 50,
    });
  }
}
