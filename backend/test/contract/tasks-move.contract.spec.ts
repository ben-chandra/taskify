import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('PATCH /api/tasks/:taskId status move permission (contract, FR-008)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let assigneeId: string;
  let otherId: string;
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
    const assignee = await prisma.user.create({ data: { name: 'Alex Chen', role: 'ENGINEER' } });
    const other = await prisma.user.create({ data: { name: 'Jordan Lee', role: 'ENGINEER' } });
    assigneeId = assignee.id;
    otherId = other.id;
    const project = await prisma.project.create({
      data: { name: 'Test Project', createdByUserId: assigneeId },
    });
    projectId = project.id;
  });

  it('allows the assignee to move the task', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: assigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', assigneeId)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('allows any user to move an unassigned task', async () => {
    const task = await prisma.task.create({ data: { projectId, title: 'Unassigned task' } });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', otherId)
      .send({ status: 'IN_REVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_REVIEW');
  });

  it('rejects a non-assignee trying to move the task, with no field applied', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: assigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', otherId)
      .send({ status: 'DONE' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('NOT_ASSIGNEE');

    const unchanged = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchanged.status).toBe('TODO');
  });

  it('allows skipping directly from TODO to DONE', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: assigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', assigneeId)
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DONE');
  });

  it('rejects the whole request when status is blocked, even if assigneeUserId is also present', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: assigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', otherId)
      .send({ status: 'DONE', assigneeUserId: otherId });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('NOT_ASSIGNEE');

    const unchanged = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchanged.status).toBe('TODO');
    expect(unchanged.assigneeUserId).toBe(assigneeId);
  });
});
