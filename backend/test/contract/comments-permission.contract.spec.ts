import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('PATCH/DELETE /api/comments/:commentId (contract, FR-014)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authorId: string;
  let otherId: string;
  let taskId: string;
  let commentId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const author = await prisma.user.create({ data: { name: 'Jordan Lee', role: 'ENGINEER' } });
    const other = await prisma.user.create({ data: { name: 'Sam Patel', role: 'ENGINEER' } });
    authorId = author.id;
    otherId = other.id;
    const project = await prisma.project.create({ data: { name: 'Test Project', createdByUserId: authorId } });
    const task = await prisma.task.create({ data: { projectId: project.id, title: 'Task' } });
    taskId = task.id;
    const comment = await prisma.comment.create({ data: { taskId, authorUserId: authorId, text: 'Original' } });
    commentId = comment.id;
  });

  it('lets the author edit their own comment', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/comments/${commentId}`)
      .set('X-User-Id', authorId)
      .send({ text: 'Updated text' });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Updated text');
    expect(res.body.updatedAt).not.toBeNull();
  });

  it('blocks a non-author from editing with 403 NOT_AUTHOR', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/comments/${commentId}`)
      .set('X-User-Id', otherId)
      .send({ text: 'Hijacked text' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('NOT_AUTHOR');
  });

  it('lets the author delete their own comment', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}`)
      .set('X-User-Id', authorId);

    expect(res.status).toBe(204);

    const deleted = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(deleted).toBeNull();
  });

  it('blocks a non-author from deleting with 403 NOT_AUTHOR', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/comments/${commentId}`)
      .set('X-User-Id', otherId);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('NOT_AUTHOR');

    const stillThere = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(stillThere).not.toBeNull();
  });
});
