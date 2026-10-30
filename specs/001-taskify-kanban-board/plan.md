# Implementation Plan: Taskify Kanban Board

**Branch**: `001-taskify-kanban-board` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-taskify-kanban-board/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Taskify is a login-free Kanban board for a fixed team of five predefined users (1
Product Manager, 4 Engineers). Users create projects, create/assign tasks, move
tasks across four columns (To Do, In Progress, In Review, Done — move restricted
to the task's current assignee per clarification), and comment on tasks (edit/
delete restricted to the comment's author). Three sample projects are seeded on
first run. Technical approach: a NestJS REST API backed by PostgreSQL for all
persistent state, paired with a React frontend that renders drag-and-drop boards
and reflects board/comment changes to all open clients in real time over
WebSockets — the "notifications" the user asked to expose are this real-time
activity stream (task created/moved/assigned, comment added/edited/deleted),
plus a REST catch-up endpoint for clients reconnecting after a drop.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (backend and frontend)

**Primary Dependencies**: NestJS 10 (REST controllers + WebSocket gateway),
Prisma ORM (Postgres client + migrations), class-validator/class-transformer
(DTO validation), React 18, @dnd-kit/core (drag-and-drop), TanStack Query
(server-state cache + optimistic updates), socket.io-client (realtime)

**Storage**: PostgreSQL 16

**Testing**: Jest + Supertest for backend unit/contract/integration tests; Jest +
React Testing Library for frontend unit/component tests

**Target Platform**: Browser frontend (evergreen Chrome/Firefox/Safari) served by
a Linux-hosted Node.js backend

**Project Type**: Web application (separate frontend + backend)

**Performance Goals**: Board and task REST reads respond within 200ms p95 at this
scale; a task move or new comment is visible on all other open clients within 1
second via the realtime channel (supports SC-003/SC-006)

**Constraints**: No authentication/login in this phase (FR-001/FR-002) — the API
is trusted-network-only, not intended for public internet exposure; all state
changes must survive reload (FR-011); comment/task mutations enforce the
author/assignee permission rules from Clarifications

**Scale/Scope**: 5 fixed users, 3 seeded projects plus user-created ones, low
concurrency (single small team, well under a few dozen simultaneous connections)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Code Quality | ESLint + TypeScript strict mode run in CI on both `backend/` and `frontend/`; every PR requires one reviewer | PASS — tooling choice imposes no extra complexity beyond standard NestJS/CRA tooling |
| II. Test-First (NON-NEGOTIABLE) | Contract tests (Supertest) and component tests (RTL) are written per endpoint/component before implementation, per task breakdown in Phase 1 | PASS — testing stack selected in Research supports red-green-refactor |
| III. UX Consistency | Single shared React component set (Board, Column, TaskCard, CommentThread, UserSwitcher) reused across all three columns/projects; no per-project visual variation | PASS |
| IV. Performance | Explicit budgets set above (200ms p95 REST, 1s realtime propagation) tied to SC-003/SC-006 | PASS |
| V. Simplicity | One NestJS service, one Postgres database, no microservices/queue/cache layer; realtime via a single Socket.IO gateway instead of a separate pub/sub system | PASS |

No violations identified. Complexity Tracking table omitted (empty by design).

**Post-Phase 1 re-check**: data-model.md, contracts/, and quickstart.md add no
new services, queues, or caches beyond the single NestJS app + Postgres +
Socket.IO gateway already justified above — all five gates still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-taskify-kanban-board/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── users/            # seeded, read-only list endpoint
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── comments/
│   │   └── notifications/    # realtime activity feed + catch-up endpoint
│   ├── common/                # DTOs, guards (assignee/author permission checks), filters
│   ├── realtime/              # Socket.IO gateway, per-project rooms
│   ├── prisma/                # schema.prisma, migrations, seed script
│   ├── app.module.ts
│   └── main.ts
└── test/
    ├── contract/              # Supertest contract tests per REST endpoint
    ├── integration/           # module-level integration tests (DB + realtime)
    └── unit/

frontend/
├── src/
│   ├── components/
│   │   ├── Board/ Column/ TaskCard/ CommentThread/ UserSwitcher/
│   ├── pages/                 # ProjectListPage, ProjectBoardPage
│   ├── services/               # REST client, Socket.IO client
│   ├── state/                  # TanStack Query hooks
│   └── App.tsx
└── tests/
    ├── integration/
    └── unit/
```

**Structure Decision**: Web application structure (separate `backend/` and
`frontend/` top-level packages, npm workspaces, no shared package) — matches the
explicit frontend/backend split in the feature input and keeps the two
deployable units independently testable per Constitution Principle I/II.

## Complexity Tracking

No Constitution Check violations — table intentionally omitted.
