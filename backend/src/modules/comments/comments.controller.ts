import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { UserContextGuard } from '../../common/user-context.guard';
import { CurrentUser } from '../../common/current-user';
import { CommentsService } from './comments.service';
import { CommentTextDto } from './dto/comment-text.dto';

@UseGuards(UserContextGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  async create(
    @Param('taskId') taskId: string,
    @Body() dto: CommentTextDto,
    @CurrentUser() user: { id: string },
  ): Promise<Comment> {
    return this.commentsService.create(taskId, dto.text, user.id);
  }

  @Patch('comments/:commentId')
  async update(
    @Param('commentId') commentId: string,
    @Body() dto: CommentTextDto,
    @CurrentUser() user: { id: string },
  ): Promise<Comment> {
    return this.commentsService.update(commentId, dto.text, user.id);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: { id: string },
  ): Promise<void> {
    return this.commentsService.remove(commentId, user.id);
  }
}
