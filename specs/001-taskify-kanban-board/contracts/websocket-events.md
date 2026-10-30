# WebSocket Contract: Taskify Kanban Board

Transport: Socket.IO. One namespace (`/`), one room per project (`project:<id>`).

## Connection lifecycle

1. Client connects with `X-User-Id` in the handshake auth payload; server
   validates against the seeded User table (reject with a custom `auth_error`
   event — never the reserved Socket.IO `connect_error` name — then
   disconnect, if missing/unknown). Any of the 5 seeded users may join any
   project's room — there is no per-project membership restriction,
   consistent with the spec's "single shared workspace" assumption
   (spec.md §Assumptions).
2. Client emits `join:project` with `{ "projectId": "uuid" }` to join that
   project's room. Server acks with the current task list (same shape as
   `GET /api/projects/:projectId/tasks` — the two MUST be kept structurally
   identical; a change to one response shape requires updating the other) so
   the client can render immediately without a separate REST call. If
   `projectId` doesn't exist, the server acks with
   `{ "error": "PROJECT_NOT_FOUND" }` instead of a task list.
3. On disconnect/reconnect, client calls
   `GET /api/projects/:projectId/notifications?since=<lastSeenTimestamp>` to
   fill any gap before re-joining the room (see rest-api.md).

## Server → client events (broadcast to the project's room)

All payloads mirror a `Notification` entry (see data-model.md).

| Event | Payload shape | Emitted when |
|---|---|---|
| `task:created` | `{ task }` | a task is created (FR-006) |
| `task:moved` | `{ taskId, fromStatus, toStatus, movedByUserId }` | a task's `status` changes (FR-008) |
| `task:assigned` | `{ taskId, assigneeUserId, assignedByUserId }` | `assigneeUserId` set to a user (FR-007) |
| `task:unassigned` | `{ taskId, unassignedByUserId }` | `assigneeUserId` set to null (FR-007) |
| `comment:added` | `{ comment }` | a comment is created (FR-009) |
| `comment:edited` | `{ commentId, text, taskId }` | the author edits their comment (FR-014) |
| `comment:deleted` | `{ commentId, taskId }` | the author deletes their comment (FR-014) |

Each event also implies a corresponding row written to the Notification table
and is included verbatim in the `GET .../notifications` catch-up response.

## Client → server events

| Event | Payload | Server behavior |
|---|---|---|
| `join:project` | `{ projectId }` | joins the Socket.IO room, acks current task list |
| `leave:project` | `{ projectId }` | leaves the room (e.g., user navigates away). No ownership check — leaving a room the client never joined (or already left) is a harmless no-op, since room membership is not a security boundary in this phase |

No task/comment mutations happen over the socket — all writes go through the
REST API (contracts/rest-api.md); the socket is read-only broadcast plus room
membership, keeping a single source of truth for validation and permission
checks (Simplicity).
