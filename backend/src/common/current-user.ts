import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

export interface RequestWithUser extends Request {
  currentUser: User;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.currentUser;
});
