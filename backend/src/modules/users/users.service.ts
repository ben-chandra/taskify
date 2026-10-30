import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { name: 'asc' } });
  }
}
