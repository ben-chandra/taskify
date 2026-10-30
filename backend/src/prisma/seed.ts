import { PrismaClient, Role, TaskStatus, User } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_USERS: Array<{ name: string; role: Role }> = [
  { name: 'Priya Shah', role: Role.PRODUCT_MANAGER },
  { name: 'Alex Chen', role: Role.ENGINEER },
  { name: 'Jordan Lee', role: Role.ENGINEER },
  { name: 'Sam Patel', role: Role.ENGINEER },
  { name: 'Morgan Diaz', role: Role.ENGINEER },
];

async function seedUsers(): Promise<User[]> {
  const users = [];
  for (const user of SEED_USERS) {
    const created = await prisma.user.upsert({
      where: { name: user.name },
      update: {},
      create: user,
    });
    users.push(created);
  }
  return users;
}

// FR-003: 3 sample projects, each with tasks spread across all 4 columns
// and a mix of assigned/unassigned tasks.
async function seedProjects(users: User[]): Promise<void> {
  const [pm, alex, jordan, sam, morgan] = users;
  const columns: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ];

  const projectDefinitions = [
    {
      name: 'Website Revamp',
      tasks: [
        { title: 'Audit current site structure', status: columns[0], assignee: alex },
        { title: 'Draft new homepage copy', status: columns[0], assignee: null },
        { title: 'Build component library', status: columns[1], assignee: jordan },
        { title: 'Review accessibility pass', status: columns[2], assignee: sam },
        { title: 'Launch beta', status: columns[3], assignee: morgan },
      ],
    },
    {
      name: 'Mobile App Launch',
      tasks: [
        { title: 'Define MVP scope', status: columns[0], assignee: pm },
        { title: 'Set up CI pipeline', status: columns[1], assignee: alex },
        { title: 'Implement push notifications', status: columns[1], assignee: null },
        { title: 'QA pass on onboarding flow', status: columns[2], assignee: jordan },
        { title: 'Submit to app stores', status: columns[3], assignee: sam },
      ],
    },
    {
      name: 'Internal Tools Cleanup',
      tasks: [
        { title: 'Inventory deprecated scripts', status: columns[0], assignee: morgan },
        { title: 'Migrate cron jobs to new scheduler', status: columns[1], assignee: sam },
        { title: 'Document on-call runbook', status: columns[2], assignee: null },
        { title: 'Retire legacy admin panel', status: columns[3], assignee: pm },
      ],
    },
  ];

  for (const definition of projectDefinitions) {
    const project = await prisma.project.upsert({
      where: { name: definition.name },
      update: {},
      create: { name: definition.name, createdByUserId: pm.id },
    });

    const existingTasks = await prisma.task.count({ where: { projectId: project.id } });
    if (existingTasks > 0) {
      continue;
    }

    for (const task of definition.tasks) {
      await prisma.task.create({
        data: {
          projectId: project.id,
          title: task.title,
          status: task.status,
          assigneeUserId: task.assignee?.id ?? null,
        },
      });
    }
  }
}

async function main() {
  const users = await seedUsers();
  console.log(`Seeded ${users.length} users.`);
  await seedProjects(users);
  console.log('Seeded 3 sample projects with tasks across all 4 columns.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
