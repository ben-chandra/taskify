import { Controller, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersService } from './users.service';

// No X-User-Id guard on this controller, intentionally: this endpoint is how
// a client discovers the 5 predefined users to populate the user switcher
// before any user has been selected (contracts/rest-api.md).
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(): Promise<User[]> {
    return this.usersService.listUsers();
  }
}
