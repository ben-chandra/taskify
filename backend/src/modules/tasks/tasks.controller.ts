import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Task } from '@prisma/client';
import { UserContextGuard } from '../../common/user-context.guard';
import { CurrentUser } from '../../common/current-user';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@UseGuards(UserContextGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:projectId/tasks')
  async listForProject(@Param('projectId') projectId: string): Promise<Task[]> {
    return this.tasksService.listByProject(projectId);
  }

  @Post('projects/:projectId/tasks')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: { id: string },
  ): Promise<Task> {
    return this.tasksService.create(projectId, dto, user.id);
  }

  @Get('tasks/:taskId')
  async getOne(@Param('taskId') taskId: string): Promise<Task & { comments: unknown[] }> {
    return this.tasksService.getOne(taskId);
  }

  @Patch('tasks/:taskId')
  async update(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: { id: string },
  ): Promise<Task> {
    return this.tasksService.update(taskId, dto, user.id);
  }
}
