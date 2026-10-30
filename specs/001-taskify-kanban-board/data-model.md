# Phase 1 Data Model: Taskify Kanban Board

Derived from the feature spec's Key Entities and Functional Requirements,
including the task-card permission rules from Clarifications.

## User

Fixed, seeded set of exactly five rows; no create/update/delete API (FR-001).

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | unique, seeded |
| role | enum: `PRODUCT_MANAGER` \| `ENGINEER` | exactly one PM, four Engineers (FR-001) |

## Project

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string, 1–200 chars, required, unique (case-insensitive) | (FR-004) |
| createdByUserId | UUID (FK → User) | any of the 5 users (FR-004) |
| createdAt | timestamp | |

Relationships: Project 1 — N Task; Project 1 — N Notification (activity).
Seed data: 3 sample projects, each with sample tasks spread across all four
columns (FR-003).

**Validation / business rules**:
- `name` must be non-empty, ≤200 chars, and unique case-insensitively; a
  create request with a name matching an existing project (any case) is
  rejected (FR-004).

## Task

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| projectId | UUID (FK → Project) | required |
| title | string, 1–200 chars, required | (FR-006) |
| description | string, 0–2000 chars, nullable | (FR-006) |
| status | enum: `TODO` \| `IN_PROGRESS` \| `IN_REVIEW` \| `DONE` | default `TODO`; free transition between any two values, any direction (FR-008) |
| assigneeUserId | UUID (FK → User), nullable | null = unassigned (FR-007) |
| createdAt | timestamp | |
| updatedAt | timestamp | bumped on any field change |

Relationships: Task N — 1 Project; Task 1 — N Comment; Task N — 1 User
(assignee, optional).

**Validation / business rules**:
- Title must be non-empty (FR-006).
- `status` transition: allowed between any two values, in any order (no
  sequential-progression constraint) — FR-008.
- **Move permission**: only enforceable if `assigneeUserId` is set — a status
  change is only permitted when the requesting user's id equals
  `assigneeUserId`; if `assigneeUserId` is null, any of the 5 users may change
  `status` (FR-008, Clarifications).
- **Assignment permission**: any of the 5 users may set `assigneeUserId` to any
  user id or to null, regardless of the current value (FR-007, Clarifications)
  — this is intentionally unrestricted so a task can never be stuck with an
  unreachable assignee blocking moves.

## Comment

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| taskId | UUID (FK → Task) | required |
| authorUserId | UUID (FK → User) | required (FR-009) |
| text | string, 1–2000 chars, required | empty text rejected (FR-013) |
| createdAt | timestamp | |
| updatedAt | timestamp, nullable | set when edited |

Relationships: Comment N — 1 Task; Comment N — 1 User (author).

**Validation / business rules**:
- `text` must be non-empty (FR-013).
- **Edit/delete permission**: only permitted when the requesting user's id
  equals `authorUserId`; no other user may edit or delete the comment
  (FR-014, Clarifications).

## Notification (activity feed entry)

Supports the real-time "notifications" API requested for the frontend's
real-time updates (see research.md §8). Not a per-user inbox — a bounded,
project-scoped activity log.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| projectId | UUID (FK → Project) | required |
| type | enum: `TASK_CREATED` \| `TASK_MOVED` \| `TASK_ASSIGNED` \| `TASK_UNASSIGNED` \| `COMMENT_ADDED` \| `COMMENT_EDITED` \| `COMMENT_DELETED` | |
| actingUserId | UUID (FK → User) | who performed the action |
| payload | JSON | minimal context, e.g. `{taskId, fromStatus, toStatus}` |
| createdAt | timestamp | |

Relationships: Notification N — 1 Project; Notification N — 1 User (actor).
Written synchronously whenever a Task or Comment mutation succeeds; broadcast
over the project's WebSocket room and persisted for the REST catch-up endpoint.

## Entity relationship summary

```text
User 1───N Project (createdBy)
User 1───N Task (assignee, optional)
User 1───N Comment (author)
User 1───N Notification (actor)
Project 1───N Task
Project 1───N Notification
Task 1───N Comment
```
