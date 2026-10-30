import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
