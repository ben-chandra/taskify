import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDatabase } from '../test-app';

describe('POST /api/projects (contract, FR-004)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;

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
  });

  it('creates a project with a valid name', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .set('X-User-Id', userId)
      .send({ name: 'Website Revamp' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Website Revamp');
    expect(res.body.createdByUserId).toBe(userId);
  });

  it('rejects an empty name with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .set('X-User-Id', userId)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('rejects a name longer than 200 characters with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .set('X-User-Id', userId)
      .send({ name: 'a'.repeat(201) });

    expect(res.status).toBe(400);
  });

  it('rejects a case-insensitive duplicate name with 409 PROJECT_NAME_TAKEN', async () => {
    await request(app.getHttpServer()).post('/api/projects').set('X-User-Id', userId).send({ name: 'Website Revamp' });

    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .set('X-User-Id', userId)
      .send({ name: 'website revamp' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('PROJECT_NAME_TAKEN');
  });
});
