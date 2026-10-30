# Phase 0 Research: Taskify Kanban Board

All Technical Context fields were specified by the user (NestJS, Postgres,
React, drag-and-drop, real-time, REST APIs for projects/tasks/notifications).
The decisions below resolve the specific library/pattern choices within that
stack.

## 1. ORM / database access

- **Decision**: Prisma ORM with Prisma Migrate for schema migrations.
- **Rationale**: Type-safe generated client matches a TypeScript-first stack
  with minimal boilerplate (schema file instead of per-entity decorator
  classes); migration workflow is simple enough for a 4-entity schema.
- **Alternatives considered**: TypeORM (first-party NestJS integration, but
  more decorator boilerplate and weaker migration ergonomics for this size of
  schema); Sequelize (less TypeScript-native, rejected).

## 2. Real-time update mechanism

- **Decision**: Socket.IO via NestJS's built-in WebSocket Gateway
  (`@nestjs/websockets` + `@nestjs/platform-socket.io`), with one room per
  project; clients join the room for the project board they have open.
- **Rationale**: First-class NestJS support, automatic reconnection, and
  room-based broadcast is exactly what's needed to push task-moved /
  task-assigned / comment-added events to everyone viewing the same board
  (supports SC-006 and the edge case of concurrent updates).
- **Alternatives considered**: Server-Sent Events (simpler but one-directional
  and weaker reconnection semantics); GraphQL subscriptions (would require
  adding a GraphQL layer solely for this, rejected per Simplicity).

## 3. Drag-and-drop library (React)

- **Decision**: `@dnd-kit/core` (+ `@dnd-kit/sortable` for column lists).
- **Rationale**: Actively maintained, accessible (keyboard support), and
  purpose-built for sortable-list/Kanban-style interactions.
- **Alternatives considered**: `react-beautiful-dnd` (unmaintained); `react-dnd`
  (lower-level, more boilerplate for the same result).

## 4. Frontend server-state layer

- **Decision**: TanStack Query for REST data fetching/caching, with optimistic
  updates on drag-and-drop and cache invalidation driven by incoming Socket.IO
  events.
- **Rationale**: Gives request de-duplication, caching, and optimistic-update
  primitives needed for a responsive board without hand-rolling them.
- **Alternatives considered**: Redux Toolkit (more boilerplate than this scope
  needs); plain `fetch`/`useEffect` (no caching/dedup, rejected per Simplicity
  — would require re-implementing what TanStack Query provides).

## 5. Request validation

- **Decision**: `class-validator` + `class-transformer` DTOs on NestJS
  controllers.
- **Rationale**: Idiomatic for NestJS, declarative validation co-located with
  the DTO shape, no parallel schema definitions to maintain.
- **Alternatives considered**: Zod (good library, but duplicates what Nest's
  DTO/pipe system already provides — rejected to avoid two validation idioms).

## 6. Testing stack

- **Decision**: Jest + Supertest for backend (unit, contract, integration);
  Jest + React Testing Library for frontend (unit/component).
- **Rationale**: Default/first-class tooling for both NestJS and React; no
  extra runners to configure.
- **Alternatives considered**: Adding Cypress/Playwright e2e now — deferred;
  not required to satisfy the spec's acceptance scenarios, which are covered by
  contract + component tests. Can be added later without rework (YAGNI).

## 7. Monorepo layout / tooling

- **Decision**: npm workspaces with two top-level packages, `backend/` and
  `frontend/`; no shared package.
- **Rationale**: Two deployable units, no code needs to be shared between them
  yet (DTO shapes are duplicated intentionally — small surface, avoids a
  premature shared-types package).
- **Alternatives considered**: Nx or Turborepo (build-system tooling not
  justified at this scale, rejected per Simplicity).

## 8. "Notifications" scope

- **Decision**: Notifications are a real-time **activity stream**, not a
  per-user inbox. Each board-affecting action (task created, task moved, task
  assigned/unassigned, comment added/edited/deleted) is broadcast over the
  project's WebSocket room, and the same events are retained in a bounded
  recent-activity table exposed via `GET /projects/:projectId/notifications`
  so a client that reconnects after a drop can catch up.
- **Rationale**: The spec defines no persisted per-user notification entity,
  read/unread state, or preferences — only that changes must be visible to all
  users (FR-011) and that comments appear without reload (SC-006). An activity
  stream satisfies that without inventing scope the spec doesn't require.
- **Alternatives considered**: Full notification center with per-user
  read/unread tracking and delivery preferences — rejected as speculative
  scope beyond the spec (violates Simplicity/YAGIN); plain REST polling with no
  WebSocket — rejected, fails the "no reload" requirement (SC-006).
