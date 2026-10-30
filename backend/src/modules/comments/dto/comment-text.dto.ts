import { IsString } from 'class-validator';

export class CommentTextDto {
  @IsString()
  text!: string;
}
