# REST API Contract: Taskify Kanban Board

Base path: `/api`, unversioned by design — this phase has exactly one
consuming frontend, so there is no versioning strategy and none is needed
until a second consumer appears. No authentication (FR-001/FR-002) — every
request carries the acting user via an `X-User-Id` header (one of the 5
seeded user ids). The backend validates it against the seeded User table:

- Header missing → `401`, `error: "MISSING_USER_HEADER"`.
- Header present but not a seeded user id → `401`, `error: "UNKNOWN_USER"`.

No rate limiting or throttling is applied in this phase — the constraint
that this API is trusted-network-only (plan.md) is considered sufficient;
this is explicitly deferred, not an oversight.

No pagination is implemented on any list endpoint in this phase — the scale
(plan.md §Scale/Scope: 3+ small projects, a handful of tasks each) does not
warrant it; every list endpoint returns the full set.

No idempotency-key mechanism is implemented — a duplicate `POST` (e.g., a
double-click) intentionally creates a duplicate record; de-duplicating
accidental double-submits is a frontend concern, not part of this contract.

No optimistic-locking/concurrency-control mechanism (e.g., ETag, version
field) is implemented — simultaneous conflicting writes to the same resource
are resolved by whichever write reaches the database last (matches the
spec's "last update applied wins" edge case and Assumptions).

CORS is restricted to the configured frontend origin only, since there is no
authentication layer otherwise protecting the API.

All error responses: `{ "error": string, "message": string }`, where `error`
is one of a fixed set of machine-readable codes (not free text) so a client
can distinguish failure reasons programmatically:

`MISSING_USER_HEADER`, `UNKNOWN_USER`, `VALIDATION_ERROR`, `EMPTY_TEXT`,
`PROJECT_NAME_TAKEN`, `UNKNOWN_ASSIGNEE`, `NOT_ASSIGNEE`, `NOT_AUTHOR`,
`NOT_FOUND`. `message` is a human-readable explanation; clients MUST branch
on `error`, not on `message` text.

## Users

### `GET /api/users`
List the 5 predefined users. Read-only — no create/update/delete per FR-001.

Response `200`:
```json
[{ "id": "uuid", "name": "string", "role": "PRODUCT_MANAGER" | "ENGINEER" }]
```

## Projects

### `GET /api/projects`
List all projects (seeded + user-created) — FR-012.

Response `200`: `[{ "id", "name", "createdByUserId", "createdAt" }]`

### `POST /api/projects`
Create a project — FR-004. Any user may call this.

Request: `{ "name": "string (1-200 chars)" }`
Response `201`: the created project.
Errors: `400 VALIDATION_ERROR` if `name` empty/too long; `409
PROJECT_NAME_TAKEN` if a project with the same name (case-insensitive)
already exists.

### `GET /api/projects/:projectId`
Fetch one project.
Response `200`: project; `404` if not found.

## Tasks

### `GET /api/projects/:projectId/tasks`
List tasks for a project, grouped implicitly by `status` (client groups into
columns) — FR-009/FR-010.

Response `200`: `[{ "id", "projectId", "title", "description", "status", "assigneeUserId", "createdAt", "updatedAt" }]`

### `POST /api/projects/:projectId/tasks`
Create a task — FR-006. Starts in `TODO`.

Request: `{ "title": "string (1-200)", "description": "string? (0-2000)", "assigneeUserId": "uuid?" }`
Response `201`: the created task.
Errors: `400 VALIDATION_ERROR` empty/too-long title or too-long description;
`400 UNKNOWN_ASSIGNEE` if `assigneeUserId` is set but isn't one of the 5
seeded users; `404 NOT_FOUND` unknown `projectId`.

### `PATCH /api/tasks/:taskId`
Update a task's `status` and/or `assigneeUserId`. Two independent permission
rules apply (Clarifications), and the request is **atomic**: if any
requested field change is not permitted, the entire request is rejected and
**no** field is updated — a caller who wants the assignee change applied
despite a blocked status change must resubmit with only `assigneeUserId`.

- `status` change: allowed only if `X-User-Id` equals the task's current
  `assigneeUserId` at the time of the request, or the task is currently
  unassigned. Otherwise the whole request is rejected with `403
  NOT_ASSIGNEE`.
- `assigneeUserId` change: allowed for any of the 5 users, regardless of
  current assignee (FR-007). If set to a non-null value that isn't one of
  the 5 seeded users, the whole request is rejected with `400
  UNKNOWN_ASSIGNEE` (distinct from unassigning via `null`, which is always
  valid).

Request (either or both fields): `{ "status": "TODO"|"IN_PROGRESS"|"IN_REVIEW"|"DONE", "assigneeUserId": "uuid|null" }`
Response `200`: the updated task (both fields applied, if both were valid).
Errors: `403 NOT_ASSIGNEE`; `400 UNKNOWN_ASSIGNEE`; `404 NOT_FOUND` unknown
task.

### `GET /api/tasks/:taskId`
Fetch one task including its comments (FR-010).
Response `200`: task + `"comments": [...]` (see Comments shape below).

## Comments

### `POST /api/tasks/:taskId/comments`
Add a comment — FR-009. No "edited" indicator concept applies to creation.

Request: `{ "text": "string (1-2000 chars, trimmed)" }`
Response `201`: `{ "id", "taskId", "authorUserId", "text", "createdAt", "updatedAt": null }`
Errors: `400 EMPTY_TEXT` if `text` is empty or whitespace-only after
trimming (FR-013); `404 NOT_FOUND` unknown task.

### `PATCH /api/comments/:commentId`
Edit a comment's text — FR-014. Allowed only if `X-User-Id` equals the
comment's `authorUserId`; otherwise `403 NOT_AUTHOR`. No "edited" indicator
is surfaced to other users (Assumptions) — the comment simply shows its
latest text and its `updatedAt` timestamp updates.

Request: `{ "text": "string (1-2000 chars, trimmed)" }`
Response `200`: updated comment (`updatedAt` set).
Errors: `400 EMPTY_TEXT`; `403 NOT_AUTHOR`; `404 NOT_FOUND` unknown comment.

### `DELETE /api/comments/:commentId`
Delete a comment — FR-014. Allowed only if `X-User-Id` equals the comment's
`authorUserId`; otherwise `403 NOT_AUTHOR`.

Response `204`.
Errors: `403 NOT_AUTHOR`; `404 NOT_FOUND` unknown comment.

## Notifications (activity feed)

### `GET /api/projects/:projectId/notifications?since=<timestamp>`
Catch-up feed for a client that reconnects after a WebSocket drop (see
research.md §8). `since` MUST be an ISO 8601 timestamp in UTC with
millisecond precision (e.g. `2026-10-29T12:34:56.789Z`). Returns activity
entries newer than `since`, newest first; if `since` is omitted, returns the
50 most recent entries.

Response `200`:
```json
[{
  "id": "uuid",
  "projectId": "uuid",
  "type": "TASK_CREATED" | "TASK_MOVED" | "TASK_ASSIGNED" | "TASK_UNASSIGNED" | "COMMENT_ADDED" | "COMMENT_EDITED" | "COMMENT_DELETED",
  "actingUserId": "uuid",
  "payload": { "...": "action-specific context" },
  "createdAt": "ISO timestamp"
}]
```
