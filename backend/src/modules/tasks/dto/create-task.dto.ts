import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;
}
