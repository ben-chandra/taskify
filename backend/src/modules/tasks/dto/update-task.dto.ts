import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  // Optional + nullable: omit to leave unchanged, null to unassign, a UUID
  // to assign (class-validator's @IsOptional treats null as skip-the-rest,
  // so null always passes and reaches the service as null).
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string | null;
}
