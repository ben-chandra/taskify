import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('POST /api/tasks/:taskId/comments (contract, FR-009/FR-013)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let taskId: string;

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
    const task = await prisma.task.create({ data: { projectId: project.id, title: 'Task' } });
    taskId = task.id;
  });

  it('adds a comment attributed to the author', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/comments`)
      .set('X-User-Id', userId)
      .send({ text: 'Looks good to me' });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Looks good to me');
    expect(res.body.authorUserId).toBe(userId);
  });

  it('rejects empty text with 400 EMPTY_TEXT', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/comments`)
      .set('X-User-Id', userId)
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('EMPTY_TEXT');
  });

  it('rejects whitespace-only text with 400 EMPTY_TEXT', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/comments`)
      .set('X-User-Id', userId)
      .send({ text: '   \n\t  ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('EMPTY_TEXT');
  });

  it('trims surrounding whitespace from stored text', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/comments`)
      .set('X-User-Id', userId)
      .send({ text: '  hello  ' });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe('hello');
  });

  it('404s for an unknown taskId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks/00000000-0000-0000-0000-000000000000/comments')
      .set('X-User-Id', userId)
      .send({ text: 'hello' });

    expect(res.status).toBe(404);
  });
});
