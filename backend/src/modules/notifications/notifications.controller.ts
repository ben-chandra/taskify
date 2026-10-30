import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UserContextGuard } from '../../common/user-context.guard';
import { NotificationsService } from './notifications.service';

@Controller('projects/:projectId/notifications')
@UseGuards(UserContextGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async catchUp(
    @Param('projectId') projectId: string,
    @Query('since') since?: string,
  ): Promise<unknown[]> {
    return this.notificationsService.catchUp(projectId, since);
  }
}
