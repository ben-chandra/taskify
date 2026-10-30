import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

describe('Seed script (integration, FR-003)', () => {
  const prisma = new PrismaClient();

  beforeAll(() => {
    execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'ignore' });
    execSync('npx ts-node --transpile-only src/prisma/seed.ts', { stdio: 'ignore' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds exactly 5 users: 1 PRODUCT_MANAGER and 4 ENGINEER', async () => {
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(5);
    expect(users.filter((u) => u.role === 'PRODUCT_MANAGER')).toHaveLength(1);
    expect(users.filter((u) => u.role === 'ENGINEER')).toHaveLength(4);
  });

  it('seeds exactly 3 projects', async () => {
    const projects = await prisma.project.findMany();
    expect(projects).toHaveLength(3);
  });

  it('gives every project at least one task in each of the 4 columns', async () => {
    const projects = await prisma.project.findMany({ include: { tasks: true } });
    for (const project of projects) {
      const statuses = new Set(project.tasks.map((t) => t.status));
      expect(statuses).toEqual(new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']));
    }
  });

  it('includes a mix of assigned and unassigned tasks', async () => {
    const tasks = await prisma.task.findMany();
    expect(tasks.some((t) => t.assigneeUserId === null)).toBe(true);
    expect(tasks.some((t) => t.assigneeUserId !== null)).toBe(true);
  });
});
