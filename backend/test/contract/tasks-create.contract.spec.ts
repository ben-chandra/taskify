import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('POST /api/projects/:projectId/tasks (contract, FR-006)', () => {
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
    const project = await prisma.project.create({ data: { name: 'Test Project', createdByUserId: userId } });
    projectId = project.id;
  });

  it('creates a task with a title, defaulting to TODO', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tasks`)
      .set('X-User-Id', userId)
      .send({ title: 'Write docs' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TODO');
    expect(res.body.assigneeUserId).toBeNull();
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tasks`)
      .set('X-User-Id', userId)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  it('rejects an unknown assigneeUserId with 400 UNKNOWN_ASSIGNEE', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/tasks`)
      .set('X-User-Id', userId)
      .send({ title: 'Write docs', assigneeUserId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('UNKNOWN_ASSIGNEE');
  });

  it('404s for an unknown projectId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/projects/00000000-0000-0000-0000-000000000000/tasks')
      .set('X-User-Id', userId)
      .send({ title: 'Write docs' });

    expect(res.status).toBe(404);
  });
});
