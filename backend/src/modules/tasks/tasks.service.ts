import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotAssigneeException,
  NotFoundApiException,
  UnknownAssigneeException,
} from '../../common/api-exception';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listByProject(projectId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOne(taskId: string): Promise<Task & { comments: unknown[] }> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!task) {
      throw new NotFoundApiException('Task');
    }
    return task;
  }

  async create(projectId: string, dto: CreateTaskDto, actingUserId: string): Promise<Task> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundApiException('Project');
    }

    if (dto.assigneeUserId) {
      await this.assertValidAssignee(dto.assigneeUserId);
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        assigneeUserId: dto.assigneeUserId ?? null,
      },
    });

    await this.notifications.recordAndBroadcast({
      projectId,
      type: 'TASK_CREATED',
      actingUserId,
      event: 'task:created',
      payload: { task: JSON.parse(JSON.stringify(task)) },
    });

    return task;
  }

  async update(taskId: string, dto: UpdateTaskDto, actingUserId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundApiException('Task');
    }

    // Validate every requested field BEFORE writing anything (atomic: all
    // fields must be valid, or none are applied — contracts/rest-api.md).
    const statusRequested = dto.status !== undefined;
    const assigneeRequested = dto.assigneeUserId !== undefined;

    if (statusRequested) {
      const canMove = task.assigneeUserId === null || task.assigneeUserId === actingUserId;
      if (!canMove) {
        throw new NotAssigneeException();
      }
    }

    if (assigneeRequested && dto.assigneeUserId !== null) {
      await this.assertValidAssignee(dto.assigneeUserId as string);
    }

    const previousAssigneeUserId = task.assigneeUserId;
    const previousStatus = task.status;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(statusRequested ? { status: dto.status } : {}),
        ...(assigneeRequested ? { assigneeUserId: dto.assigneeUserId } : {}),
      },
    });

    if (statusRequested && dto.status !== previousStatus) {
      await this.notifications.recordAndBroadcast({
        projectId: updated.projectId,
        type: 'TASK_MOVED',
        actingUserId,
        event: 'task:moved',
        payload: { taskId, fromStatus: previousStatus, toStatus: updated.status, movedByUserId: actingUserId },
      });
    }

    if (assigneeRequested && dto.assigneeUserId !== previousAssigneeUserId) {
      if (dto.assigneeUserId === null) {
        await this.notifications.recordAndBroadcast({
          projectId: updated.projectId,
          type: 'TASK_UNASSIGNED',
          actingUserId,
          event: 'task:unassigned',
          payload: { taskId, unassignedByUserId: actingUserId },
        });
      } else {
        await this.notifications.recordAndBroadcast({
          projectId: updated.projectId,
          type: 'TASK_ASSIGNED',
          actingUserId,
          event: 'task:assigned',
          payload: { taskId, assigneeUserId: dto.assigneeUserId, assignedByUserId: actingUserId },
        });
      }
    }

    return updated;
  }

  private async assertValidAssignee(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnknownAssigneeException();
    }
  }
}
