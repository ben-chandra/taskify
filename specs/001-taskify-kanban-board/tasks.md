---

description: "Task list template for feature implementation"
---

# Tasks: Taskify Kanban Board

**Input**: Design documents from `/specs/001-taskify-kanban-board/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. Constitution Principle II (Test-First, NON-NEGOTIABLE) requires tests written
before implementation; contract tests below MUST be written and shown to fail before their
corresponding implementation task.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) to enable
independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Path Conventions

Web app structure per plan.md: `backend/src/`, `backend/test/`, `frontend/src/`, `frontend/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo and project initialization

- [X] T001 Create npm-workspaces monorepo root `package.json` with workspaces `["backend", "frontend"]` per plan.md Project Structure
- [X] T002 Initialize NestJS backend project in `backend/` (Nest CLI scaffold, `package.json`, `tsconfig.json`, `src/main.ts` stub) with dependencies `@nestjs/core`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `prisma`, `@prisma/client`, `class-validator`, `class-transformer`
- [X] T003 [P] Initialize React frontend project in `frontend/` (Vite + TypeScript scaffold) with dependencies `react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@tanstack/react-query`, `socket.io-client`
- [X] T004 [P] Configure ESLint + TypeScript strict mode for `backend/` (Constitution Principle I)
- [X] T005 [P] Configure ESLint + TypeScript strict mode for `frontend/` (Constitution Principle I)
- [X] T006 [P] Configure Jest + Supertest test runner for `backend/`
- [X] T007 [P] Configure Jest + React Testing Library test runner for `frontend/`
- [X] T008 Create `backend/.env.example` documenting `DATABASE_URL` per quickstart.md prerequisites

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define Prisma schema — `User`, `Project`, `Task`, `Comment`, `Notification` models and `Role`, `TaskStatus`, `NotificationType` enums — in `backend/src/prisma/schema.prisma` per data-model.md
- [X] T010 Run the initial Prisma migration creating all 5 tables (depends on T009)
- [X] T011 [P] Implement seed script seeding exactly 5 users — 1 `PRODUCT_MANAGER` + 4 `ENGINEER` — in `backend/src/prisma/seed.ts` (FR-001) (depends on T010)
- [X] T012 Bootstrap the NestJS app — `backend/src/app.module.ts`, `backend/src/main.ts` — with a global `ValidationPipe` and a `PrismaService` provider (depends on T009)
- [X] T013 [P] Implement the `X-User-Id` request guard in `backend/src/common/user-context.guard.ts`, validating the header against the 5 seeded users and rejecting unknown ids with `401` (depends on T011, T012)
- [X] T014 [P] Implement a global exception filter standardizing `{ "error", "message" }` error responses in `backend/src/common/http-exception.filter.ts` (depends on T012)
- [X] T015 Implement the Users module — `GET /api/users` read-only listing of the 5 seeded users — in `backend/src/modules/users/users.controller.ts` (FR-001) (depends on T012, T013)
- [X] T016 [P] Implement the realtime Socket.IO gateway skeleton — `X-User-Id` handshake auth, `join:project`/`leave:project` room handling — in `backend/src/realtime/realtime.gateway.ts` per contracts/websocket-events.md (depends on T012, T013)
- [X] T017 [P] Scaffold the React app shell — `frontend/src/App.tsx`, router, REST client wrapper that injects `X-User-Id` on every request — (depends on T003)
- [X] T018 [P] Implement the Socket.IO client service — connects with `X-User-Id`, exposes join/leave helpers — in `frontend/src/services/socket.ts` per contracts/websocket-events.md (depends on T003)
- [X] T019 [P] Implement the `UserSwitcher` component and active-user app state, backed by `GET /api/users` (FR-002) in `frontend/src/components/UserSwitcher/UserSwitcher.tsx` (depends on T017)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - View and Move Tasks on a Kanban Board (Priority: P1) 🎯 MVP

**Goal**: A user opens a seeded project and sees its tasks grouped into 4 columns; moving a task is
restricted to its current assignee (or anyone, if unassigned), and changes persist and propagate to
other open clients in real time.

**Independent Test**: Load the app, select the user assigned to a sample task (or any user if
unassigned), open the project, drag that task from "To Do" to "In Progress" — it moves immediately,
survives reload, and a non-assignee attempting the same move is blocked.

### Tests for User Story 1 ⚠️

> Write these tests FIRST, and confirm they FAIL before implementation.

- [X] T020 [P] [US1] Contract test `GET /api/projects/:projectId/tasks` in `backend/test/contract/tasks-list.contract.spec.ts`
- [X] T021 [P] [US1] Contract test `PATCH /api/tasks/:taskId` status change — `200` when the caller is the assignee, `200` when the task is unassigned regardless of caller, `403` for a non-assignee (FR-008) — in `backend/test/contract/tasks-move.contract.spec.ts`
- [X] T022 [P] [US1] Integration test confirming the seed produces exactly 3 projects with tasks spread across all 4 columns (FR-003) in `backend/test/integration/seed.integration.spec.ts`
- [X] T023 [P] [US1] Component test: `Board` renders all 4 columns (To Do, In Progress, In Review, Done) with tasks grouped by status, including the empty-project case (FR-005, Edge Cases) in `frontend/tests/unit/Board.test.tsx`

### Implementation for User Story 1

- [X] T024 [P] [US1] Implement Projects read endpoints `GET /api/projects` and `GET /api/projects/:projectId` in `backend/src/modules/projects/projects.controller.ts` + `projects.service.ts` (FR-012)
- [X] T025 [P] [US1] Implement Tasks read endpoints `GET /api/projects/:projectId/tasks` and `GET /api/tasks/:taskId` (including its comments) in `backend/src/modules/tasks/tasks.controller.ts` + `tasks.service.ts` (FR-010)
- [X] T026 [US1] Implement `PATCH /api/tasks/:taskId` status-change logic: permit only when `X-User-Id` equals `task.assigneeUserId`, or `assigneeUserId` is null; otherwise return `403` (FR-008) in `backend/src/modules/tasks/tasks.service.ts` (depends on T025)
- [X] T027 [US1] Emit a `task:moved` event to the project's Socket.IO room and write a `Notification` row on a successful status change, per contracts/websocket-events.md (depends on T026, T016) in `backend/src/modules/tasks/tasks.service.ts`
- [X] T028 [P] [US1] Extend the seed script to populate 3 sample projects, each with tasks spread across all 4 columns and a mix of assigned/unassigned tasks (FR-003) in `backend/src/prisma/seed.ts` (depends on T011)
- [X] T029 [P] [US1] Build `ProjectListPage` listing projects from `GET /api/projects` (FR-012) in `frontend/src/pages/ProjectListPage.tsx`
- [X] T030 [P] [US1] Build the `Column` component rendering one status column with its tasks in `frontend/src/components/Column/Column.tsx`
- [X] T031 [P] [US1] Build the `TaskCard` component showing title + assignee name/"Unassigned", draggable via `@dnd-kit/core` (FR-010) in `frontend/src/components/TaskCard/TaskCard.tsx`
- [X] T032 [US1] Build the `Board` component composing the 4 `Column`s + `TaskCard`s from `GET /api/projects/:projectId/tasks` via TanStack Query, calling `PATCH /api/tasks/:taskId` with an optimistic update on drag-drop (depends on T030, T031) in `frontend/src/components/Board/Board.tsx`
- [X] T033 [US1] Handle a blocked-move `403` response in `Board`: roll back the optimistic update and show an inline "only the assignee can move this task" message (FR-008 Edge Case) (depends on T032) in `frontend/src/components/Board/Board.tsx`
- [X] T034 [US1] Build `ProjectBoardPage`: joins the project's Socket.IO room on mount, renders `Board`, and updates the TanStack Query cache on `task:moved` events (depends on T032, T018) in `frontend/src/pages/ProjectBoardPage.tsx`
- [X] T035 [US1] Run quickstart.md User Story 1 validation scenarios (steps 1–6) end-to-end against a seeded database (depends on T027, T033, T034)

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Create Projects and Tasks (Priority: P2)

**Goal**: Any user can create a project, add tasks to it, and assign/reassign/unassign any task to
any of the 5 users, independent of who currently holds it.

**Independent Test**: Select a user, create a project, add a task with a title/description, and
assign it to a different user; a third user can then reassign it again without restriction.

### Tests for User Story 2 ⚠️

- [X] T036 [P] [US2] Contract test `POST /api/projects` validates name 1–200 chars, rejects empty with `400`, and rejects a case-insensitive duplicate name with `409 PROJECT_NAME_TAKEN` (FR-004) in `backend/test/contract/projects-create.contract.spec.ts`
- [X] T037 [P] [US2] Contract test `POST /api/projects/:projectId/tasks` requires a non-empty title, defaults `status` to `TODO`, and rejects an unknown `assigneeUserId` with `400 UNKNOWN_ASSIGNEE` (FR-006) in `backend/test/contract/tasks-create.contract.spec.ts`
- [X] T038 [P] [US2] Contract test `PATCH /api/tasks/:taskId` `assigneeUserId` change succeeds for any of the 5 users regardless of the current assignee, rejects an unknown id with `400 UNKNOWN_ASSIGNEE`, and rejects the whole request with `403 NOT_ASSIGNEE` (no fields applied) when `status` is also present and blocked (FR-007) in `backend/test/contract/tasks-assign.contract.spec.ts`

### Implementation for User Story 2

- [X] T039 [US2] Implement `POST /api/projects` (FR-004), rejecting a name matching an existing project case-insensitively with `409 PROJECT_NAME_TAKEN`, in `backend/src/modules/projects/projects.controller.ts` + `projects.service.ts` (depends on T024)
- [X] T040 [US2] Implement `POST /api/projects/:projectId/tasks`, defaulting `status` to `TODO`, validating `description` ≤2000 chars and rejecting an `assigneeUserId` that isn't one of the 5 seeded users with `400 UNKNOWN_ASSIGNEE` (FR-006) in `backend/src/modules/tasks/tasks.controller.ts` + `tasks.service.ts` (depends on T025)
- [X] T041 [US2] Implement the `assigneeUserId` branch of `PATCH /api/tasks/:taskId`: permit any of the 5 users to set it to any user id or `null` independent of the move-permission check, rejecting an unknown non-null id with `400 UNKNOWN_ASSIGNEE`; if both `status` and `assigneeUserId` are present and `status` is blocked, reject the whole request with `403 NOT_ASSIGNEE` and apply neither field (FR-007) in `backend/src/modules/tasks/tasks.service.ts` (depends on T026)
- [X] T042 [US2] Emit `task:created`, `task:assigned`, `task:unassigned` events + `Notification` rows for create/assign/unassign actions (depends on T039, T040, T041, T016) in `backend/src/modules/tasks/tasks.service.ts` and `projects.service.ts`
- [X] T043 [P] [US2] Build `CreateProjectModal` (name input, calls `POST /api/projects`) in `frontend/src/components/CreateProjectModal/CreateProjectModal.tsx`
- [X] T044 [P] [US2] Build `CreateTaskModal` (title + optional description + optional assignee selector, calls `POST /api/projects/:projectId/tasks`) in `frontend/src/components/CreateTaskModal/CreateTaskModal.tsx`
- [X] T045 [US2] Build an `AssigneeSelector` control on `TaskCard` letting any user reassign or unassign via `PATCH /api/tasks/:taskId` (depends on T031) in `frontend/src/components/TaskCard/AssigneeSelector.tsx`
- [X] T046 [US2] Wire `CreateProjectModal` into `ProjectListPage`, and `CreateTaskModal` + `AssigneeSelector` into `Board`/`TaskCard`, invalidating TanStack Query caches on success (depends on T029, T032, T043, T044, T045)
- [X] T047 [US2] Run quickstart.md User Story 2 validation scenarios end-to-end (depends on T042, T046)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Comment on Tasks (Priority: P3)

**Goal**: Any user can comment on any task; only the comment's author can edit or delete it.

**Independent Test**: Open any task, post a comment as the active user, confirm it's attributed and
persists on reload; confirm a different user can see it but has no edit/delete control for it.

### Tests for User Story 3 ⚠️

- [X] T048 [P] [US3] Contract test `POST /api/tasks/:taskId/comments` rejects empty/whitespace-only text with `400` (FR-013) in `backend/test/contract/comments-create.contract.spec.ts`
- [X] T049 [P] [US3] Contract test `PATCH`/`DELETE /api/comments/:commentId` succeed only for the comment's author and return `403` otherwise (FR-014) in `backend/test/contract/comments-permission.contract.spec.ts`

### Implementation for User Story 3

- [X] T050 [P] [US3] Implement the Comments module `POST /api/tasks/:taskId/comments`, trimming `text` and rejecting empty/whitespace-only with `400 EMPTY_TEXT` (FR-009, FR-013) in `backend/src/modules/comments/comments.controller.ts` + `comments.service.ts`
- [X] T051 [US3] Implement `PATCH /api/comments/:commentId` and `DELETE /api/comments/:commentId`, permitting the action only when `X-User-Id` equals the comment's `authorUserId` (FR-014) in `backend/src/modules/comments/comments.service.ts` (depends on T050)
- [X] T052 [US3] Emit `comment:added`, `comment:edited`, `comment:deleted` events + `Notification` rows (depends on T051, T016) in `backend/src/modules/comments/comments.service.ts`
- [X] T053 [P] [US3] Build `CommentThread` listing a task's comments in posted order, showing edit/delete controls only on comments authored by the active user (FR-014) in `frontend/src/components/CommentThread/CommentThread.tsx`
- [X] T054 [US3] Wire `CommentThread` into the task detail view: post via `POST`, update immediately on `comment:added`/`comment:edited`/`comment:deleted` socket events (depends on T053, T034) in `frontend/src/pages/ProjectBoardPage.tsx`
- [X] T055 [US3] Run quickstart.md User Story 3 validation scenarios end-to-end (depends on T052, T054)

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Resilience and finishing touches that span multiple user stories

- [X] T056 [P] Implement `GET /api/projects/:projectId/notifications` catch-up endpoint per contracts/rest-api.md in `backend/src/modules/notifications/notifications.controller.ts` + `notifications.service.ts`
- [X] T057 Add reconnect handling in the frontend Socket.IO client service: on reconnect, call the notifications catch-up endpoint and reconcile the TanStack Query cache (depends on T056, T018) in `frontend/src/services/socket.ts`
- [X] T058 [P] Restrict backend CORS to the frontend's origin only, since there is no authentication layer otherwise protecting the API (trusted-network-only constraint) in `backend/src/main.ts`
- [X] T059 [P] Add a root `README.md` documenting setup/run commands, pointing to quickstart.md
- [X] T060 Run the full quickstart.md validation end-to-end, including the Edge Cases spot-check section (depends on T035, T047, T055, T056)

---

## Phase 7: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between the shipped implementation and
spec.md/plan.md — primarily missing regression coverage for bugs found and fixed via manual
browser testing, plus minor documentation drift.

- [ ] T061 Add a backend/integration test verifying a Socket.IO client successfully connects and receives a `join:project` acknowledgment, guarding against the `auth`-callback handshake regression (client never sent the CONNECT packet until fixed) per plan: realtime WebSocket decision (missing)
- [ ] T062 Add a backend test verifying a WebSocket connection with a missing or unknown `X-User-Id` receives an `auth_error` event and disconnects cleanly without crashing the gateway, guarding against the reserved-event-name (`connect_error`) crash per plan: realtime WebSocket decision (missing)
- [ ] T063 Add a frontend test for `CommentThread` verifying no edit/delete control is rendered for a comment the active user did not author per FR-014 (missing)
- [ ] T064 Add a frontend test verifying that clicking a draggable task card's title opens the task detail view, guarding against dnd-kit's drag listeners swallowing the click per US3 Independent Test / FR-010 (missing)
- [ ] T065 Add a lightweight timing assertion or benchmark verifying REST task/project reads and realtime event propagation stay within the budgets plan.md commits to (200ms p95 REST, 1s realtime) per plan: Performance Goals; Constitution IV (partial)
- [ ] T066 Add a backend test for concurrent `PATCH /api/tasks/:taskId` requests to the same task, asserting a single deterministic final state (last write wins, no corruption) per Edge Cases: concurrent task updates (missing)
- [ ] T067 Update plan.md's Technical Context to reflect the actually-installed frontend stack (React 19.3.1, TypeScript ~7.0.2, oxlint) instead of the originally planned React 18 / TypeScript 5.x / ESLint per plan: Technical Context (contradicts)
- [ ] T068 Reconcile spec.md's Assumptions section — which states real-time multi-user sync is out of scope for this phase — with the fully-implemented WebSocket realtime sync delivered per plan.md and explicit user request; the implementation is correct and should not be removed, only the spec wording updated per spec: Assumptions vs plan: Summary (contradicts)

**Checkpoint**: Re-running `/speckit-converge` after these land should find zero or substantially
fewer actionable findings.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses Projects/Tasks endpoints and
  components from US1 (T024, T025, T026, T029, T031, T032) but adds its own create/assign
  capability without changing US1's move behavior
- **User Story 3 (Phase 5)**: Depends on Foundational; reuses `ProjectBoardPage` (T034) from US1
  to host the comment thread, but its own Comments module is fully independent
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel once their prerequisite init task is done
- All Foundational tasks marked [P] can run in parallel
- Once Foundational is complete, US1/US2/US3 test-writing and model/endpoint work can proceed in
  parallel across team members, though US2 and US3 each touch files US1 also touches
  (`tasks.service.ts`), so coordinate on that file
- Within each story, all [P] tasks (tests, independent components) can run together

---

## Parallel Example: User Story 1

```bash
# Tests first (write and confirm they fail):
Task: "Contract test GET /api/projects/:projectId/tasks in backend/test/contract/tasks-list.contract.spec.ts"
Task: "Contract test PATCH /api/tasks/:taskId move permission in backend/test/contract/tasks-move.contract.spec.ts"
Task: "Integration test seed produces 3 projects across 4 columns in backend/test/integration/seed.integration.spec.ts"
Task: "Component test Board renders 4 columns in frontend/tests/unit/Board.test.tsx"

# Independent implementation files:
Task: "Projects read endpoints in backend/src/modules/projects/projects.controller.ts"
Task: "Tasks read endpoints in backend/src/modules/tasks/tasks.controller.ts"
Task: "ProjectListPage in frontend/src/pages/ProjectListPage.tsx"
Task: "Column component in frontend/src/components/Column/Column.tsx"
Task: "TaskCard component in frontend/src/components/TaskCard/TaskCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md US1 scenarios independently
5. Demo: board viewing + assignee-gated task movement, real-time across two browser tabs

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate → demo (MVP)
3. Add User Story 2 → validate → demo (project/task creation + open assignment)
4. Add User Story 3 → validate → demo (author-gated comments)
5. Polish (notification catch-up, CORS, docs) → final validation

### Parallel Team Strategy

With multiple developers, after Foundational:

- Developer A: User Story 1 (board + move permission)
- Developer B: User Story 2 (create/assign) — coordinate with A on `tasks.service.ts`
- Developer C: User Story 3 (comments) — independent module, lowest file overlap

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task
- [Story] label maps task to specific user story for traceability
- Tests MUST be written and confirmed failing before their implementation task (Constitution
  Principle II)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
