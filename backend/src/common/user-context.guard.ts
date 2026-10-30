import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MissingUserHeaderException, UnknownUserException } from './api-exception';
import { RequestWithUser } from './current-user';

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.header('X-User-Id');

    if (!userId) {
      throw new MissingUserHeaderException();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnknownUserException();
    }

    request.currentUser = user;
    return true;
  }
}
