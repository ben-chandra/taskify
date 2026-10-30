import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundApiException, ProjectNameTakenException } from '../../common/api-exception';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(): Promise<Project[]> {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async getProject(projectId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundApiException('Project');
    }
    return project;
  }

  async createProject(name: string, createdByUserId: string): Promise<Project> {
    const existing = await this.prisma.project.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ProjectNameTakenException();
    }

    return this.prisma.project.create({
      data: { name, createdByUserId },
    });
  }
}
