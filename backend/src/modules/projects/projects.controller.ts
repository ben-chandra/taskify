import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Project } from '@prisma/client';
import { UserContextGuard } from '../../common/user-context.guard';
import { CurrentUser } from '../../common/current-user';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
@UseGuards(UserContextGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list(): Promise<Project[]> {
    return this.projectsService.listProjects();
  }

  @Get(':projectId')
  async getOne(@Param('projectId') projectId: string): Promise<Project> {
    return this.projectsService.getProject(projectId);
  }

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { id: string },
  ): Promise<Project> {
    return this.projectsService.createProject(dto.name, user.id);
  }
}
