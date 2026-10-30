import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('GET /api/projects/:projectId/tasks (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const user = await prisma.user.create({ data: { name: 'Priya Shah', role: 'PRODUCT_MANAGER' } });
    userId = user.id;
    const project = await prisma.project.create({
      data: { name: 'Test Project', createdByUserId: user.id },
    });
    projectId = project.id;
    await prisma.task.create({ data: { projectId, title: 'A task' } });
  });

  it('rejects a request with no X-User-Id header', async () => {
    const res = await request(app.getHttpServer()).get(`/api/projects/${projectId}/tasks`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('MISSING_USER_HEADER');
  });

  it('lists tasks for the project', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}/tasks`)
      .set('X-User-Id', userId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('A task');
    expect(res.body[0].status).toBe('TODO');
  });

  it('returns an empty array for a project with zero tasks', async () => {
    const empty = await prisma.project.create({
      data: { name: 'Empty Project', createdByUserId: userId },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/projects/${empty.id}/tasks`)
      .set('X-User-Id', userId);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
