import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  EmptyTextException,
  NotAuthorException,
  NotFoundApiException,
  ValidationApiException,
} from '../../common/api-exception';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(taskId: string, rawText: string, authorUserId: string): Promise<Comment> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundApiException('Task');
    }

    const text = this.validateText(rawText);

    const comment = await this.prisma.comment.create({
      data: { taskId, authorUserId, text },
    });

    await this.notifications.recordAndBroadcast({
      projectId: task.projectId,
      type: 'COMMENT_ADDED',
      actingUserId: authorUserId,
      event: 'comment:added',
      payload: { comment: JSON.parse(JSON.stringify(comment)) },
    });

    return comment;
  }

  async update(commentId: string, rawText: string, actingUserId: string): Promise<Comment> {
    const comment = await this.getOwnedComment(commentId, actingUserId);
    const text = this.validateText(rawText);

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { text, updatedAt: new Date() },
    });

    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: comment.taskId } });
    await this.notifications.recordAndBroadcast({
      projectId: task.projectId,
      type: 'COMMENT_EDITED',
      actingUserId,
      event: 'comment:edited',
      payload: { commentId, text, taskId: comment.taskId },
    });

    return updated;
  }

  async remove(commentId: string, actingUserId: string): Promise<void> {
    const comment = await this.getOwnedComment(commentId, actingUserId);
    const task = await this.prisma.task.findUniqueOrThrow({ where: { id: comment.taskId } });

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.notifications.recordAndBroadcast({
      projectId: task.projectId,
      type: 'COMMENT_DELETED',
      actingUserId,
      event: 'comment:deleted',
      payload: { commentId, taskId: comment.taskId },
    });
  }

  private async getOwnedComment(commentId: string, actingUserId: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundApiException('Comment');
    }
    if (comment.authorUserId !== actingUserId) {
      throw new NotAuthorException();
    }
    return comment;
  }

  private validateText(rawText: string): string {
    const trimmed = rawText.trim();
    if (trimmed.length === 0) {
      throw new EmptyTextException('text');
    }
    if (trimmed.length > 2000) {
      throw new ValidationApiException('text must be at most 2000 characters.');
    }
    return trimmed;
  }
}
