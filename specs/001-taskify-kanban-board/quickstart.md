# Quickstart: Taskify Kanban Board

Validates the feature end-to-end against the User Stories in
[spec.md](./spec.md). Endpoint/event shapes are defined in
[contracts/rest-api.md](./contracts/rest-api.md) and
[contracts/websocket-events.md](./contracts/websocket-events.md); entity
shapes in [data-model.md](./data-model.md).

## Prerequisites

- Node.js 20 LTS, npm
- PostgreSQL 16 running locally (or via Docker), with a database created for
  this project
- `backend/.env` with `DATABASE_URL` pointing at that database

## Setup

```bash
# from repo root
npm install --workspaces

# backend: run migrations + seed 5 users and 3 sample projects (FR-001, FR-003)
npm run prisma:migrate --workspace backend
npm run seed --workspace backend

# start backend (REST + WebSocket gateway)
npm run start:dev --workspace backend

# start frontend (separate terminal)
npm run start --workspace frontend
```

## Validation scenarios

### US1 — View and move tasks on a Kanban board (P1)

1. Open the frontend; select one of the 5 seeded users from the user switcher.
2. Open a seeded sample project. **Expect**: board renders all four columns
   (To Do, In Progress, In Review, Done) populated with sample tasks.
3. As the active user, drag a task **assigned to that user** from "To Do" to
   "In Progress". **Expect**: it moves instantly in the UI, and
   `PATCH /api/tasks/:taskId` returns `200`.
4. Reload the page. **Expect**: the task is still in "In Progress" (FR-011).
5. Switch to a different user who is **not** the task's assignee and attempt
   to move it. **Expect**: the move is blocked (`403` from the API; UI
   prevents the drag or shows an error) per FR-008.
6. Open the same board in a second browser tab as a different user. Move the
   task in tab 1. **Expect**: tab 2 updates within ~1 second with no reload
   (Socket.IO `task:moved` event, SC-003/SC-006).

### US2 — Create projects and tasks (P2)

1. As any active user, create a new project with a name. **Expect**: it
   appears in the project list with an empty board (all 4 columns, FR-004).
2. Add a task with a title and description. **Expect**: it appears in "To Do"
   (FR-006).
3. Assign the task to a different user than the one currently active.
   **Expect**: assignment succeeds regardless of who is active (FR-007), and
   the assignee's name displays on the task card.

### US3 — Comment on tasks (P3)

1. Open any task; post a comment as the active user. **Expect**: it appears
   attributed to that user with a timestamp, immediately, no reload (SC-006).
2. Switch to a different user and open the same task. **Expect**: the comment
   is visible, attributed correctly.
3. As the comment's original author, edit or delete it. **Expect**: the change
   applies (FR-014).
4. As a different user, attempt to edit/delete someone else's comment.
   **Expect**: no edit/delete control is available / API returns `403`.

### Edge cases to spot-check

- Submit a comment with empty text → rejected with a prompt (FR-013).
- Open a project with zero tasks → all four columns render, empty.
- Unassign a task, then move it as any user → allowed (FR-008 unassigned
  case).
- Disconnect the frontend's WebSocket (e.g., devtools offline toggle), make a
  change from another client, reconnect → `GET /api/projects/:projectId/notifications?since=...`
  fills the gap on reconnect.
