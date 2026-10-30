# Taskify

A login-free Kanban board for a fixed team of 5 predefined users (1 Product
Manager, 4 Engineers). See [specs/001-taskify-kanban-board/spec.md](specs/001-taskify-kanban-board/spec.md)
for full requirements and [quickstart.md](specs/001-taskify-kanban-board/quickstart.md)
for detailed validation scenarios.

## Stack

- **Backend**: NestJS + Prisma + PostgreSQL + Socket.IO (`backend/`)
- **Frontend**: React + Vite + TanStack Query + @dnd-kit (`frontend/`)

## Prerequisites

- Node.js 20+, npm
- A running PostgreSQL instance (e.g. via Docker: `docker run -d --name taskify-postgres -e POSTGRES_USER=taskify -e POSTGRES_PASSWORD=taskify -e POSTGRES_DB=taskify_dev -p 5432:5432 postgres:16`)

## Setup

```bash
npm install

cp backend/.env.example backend/.env
# edit backend/.env if your DATABASE_URL differs from the default

npm run --workspace backend prisma:migrate
npm run --workspace backend seed
```

## Run

```bash
npm run dev:backend    # NestJS API + WebSocket gateway on :3000
npm run dev:frontend   # React app on :5173
```

Open http://localhost:5173, pick one of the 5 seeded users from the switcher,
and open a seeded project.

## Test

```bash
npm run test:backend   # unit + contract + integration (Jest + Supertest)
npm run --workspace frontend test   # component tests (Jest + React Testing Library)
```

## Project layout

See [plan.md](specs/001-taskify-kanban-board/plan.md) for the full structure
and design rationale; [contracts/](specs/001-taskify-kanban-board/contracts/)
documents the REST and WebSocket APIs.
