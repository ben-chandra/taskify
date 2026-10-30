import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('PATCH /api/tasks/:taskId assigneeUserId (contract, FR-007)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let currentAssigneeId: string;
  let newAssigneeId: string;
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
    const current = await prisma.user.create({ data: { name: 'Alex Chen', role: 'ENGINEER' } });
    const newAssignee = await prisma.user.create({ data: { name: 'Jordan Lee', role: 'ENGINEER' } });
    currentAssigneeId = current.id;
    newAssigneeId = newAssignee.id;
    const project = await prisma.project.create({ data: { name: 'Test Project', createdByUserId: currentAssigneeId } });
    projectId = project.id;
  });

  it('allows any user to reassign a task regardless of current assignee', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: currentAssigneeId },
    });

    // newAssignee is NOT the current assignee, yet can still reassign it.
    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', newAssigneeId)
      .send({ assigneeUserId: newAssigneeId });

    expect(res.status).toBe(200);
    expect(res.body.assigneeUserId).toBe(newAssigneeId);
  });

  it('allows unassigning via null', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: currentAssigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', newAssigneeId)
      .send({ assigneeUserId: null });

    expect(res.status).toBe(200);
    expect(res.body.assigneeUserId).toBeNull();
  });

  it('rejects an unknown non-null assigneeUserId with 400 UNKNOWN_ASSIGNEE', async () => {
    const task = await prisma.task.create({ data: { projectId, title: 'Task' } });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', currentAssigneeId)
      .send({ assigneeUserId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('UNKNOWN_ASSIGNEE');
  });

  it('rejects the whole request with 403 NOT_ASSIGNEE and applies neither field when status is also present and blocked', async () => {
    const task = await prisma.task.create({
      data: { projectId, title: 'Task', assigneeUserId: currentAssigneeId },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/tasks/${task.id}`)
      .set('X-User-Id', newAssigneeId)
      .send({ status: 'DONE', assigneeUserId: newAssigneeId });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('NOT_ASSIGNEE');

    const unchanged = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchanged.assigneeUserId).toBe(currentAssigneeId);
    expect(unchanged.status).toBe('TODO');
  });
});
