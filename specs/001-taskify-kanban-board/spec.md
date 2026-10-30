# Feature Specification: Taskify Kanban Board

**Feature Branch**: `001-taskify-kanban-board`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Develop Taskify, a team productivity platform where predefined users create projects, assign tasks, comment, and move tasks across Kanban columns (To Do, In Progress, In Review, Done). Five users (one product manager, four engineers), three sample projects, no login for this first phase."

## Clarifications

### Session 2026-10-29

- Q: Can any of the five users move any task to a different column, or only the task's current assignee? → A: Only the task's current assignee can move it; an unassigned task may be moved by any user.
- Q: Once a comment is posted, can it later be edited or deleted, and by whom? → A: The comment's author can edit or delete only their own comment; other users cannot.
- Q: Who is allowed to set or change a task's assignee? → A: Any of the five users can assign, reassign, or unassign any task.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Move Tasks on a Kanban Board (Priority: P1)

A team member picks one of the five predefined identities, opens one of the sample
projects, and sees its tasks organized into four columns (To Do, In Progress, In
Review, Done). They move a task from one column to the next as work progresses.

**Why this priority**: This is the core value of Taskify — visualizing and tracking
work. It is demonstrable immediately using the pre-loaded sample projects, without
needing project/task creation to be built first.

**Independent Test**: Load the app, select the predefined user assigned to a
sample task (or any user if the task is unassigned), open the project, and
drag/move that task from "To Do" to "In Progress". The task's new column is
reflected immediately and persists on reload.

**Acceptance Scenarios**:

1. **Given** a sample project with tasks in each column, **When** a user opens the
   project board, **Then** all tasks are displayed grouped under their current
   column (To Do, In Progress, In Review, Done).
2. **Given** a task in the "To Do" column assigned to the active user (or
   unassigned), **When** the user moves it to "In Progress", **Then** the task
   appears under "In Progress" and no longer under "To Do".
3. **Given** a task assigned to a different user than the one currently active,
   **When** the active user attempts to move it, **Then** the system MUST
   prevent the move.
4. **Given** a task has been moved to a new column, **When** the page is reloaded,
   **Then** the task still appears in the column it was moved to.

---

### User Story 2 - Create Projects and Tasks (Priority: P2)

A team member creates a new project and adds tasks to it, optionally assigning
each task to one of the five predefined users.

**Why this priority**: Enables the team to manage new work beyond the seeded
sample projects, building directly on the board from User Story 1.

**Independent Test**: Select a predefined user, create a new project, add a task
to it with a title and description, and confirm the task appears in the "To Do"
column of the new project's board.

**Acceptance Scenarios**:

1. **Given** a user is active, **When** they create a new project with a name,
   **Then** the project appears in the project list and has an empty board with
   all four columns visible.
2. **Given** an existing project, **When** a user adds a task with a title and
   description, **Then** the task appears in the "To Do" column.
3. **Given** a task being created or edited, **When** a user assigns it to one of
   the five predefined users, **Then** the assignee's name is displayed on the
   task.
4. **Given** a task assigned to one user, **When** a different, non-assignee
   user reassigns it to someone else (or unassigns it), **Then** the change is
   accepted and the new assignee (or "Unassigned") is displayed.

---

### User Story 3 - Comment on Tasks (Priority: P3)

A team member adds a comment to a task to share context, status updates, or
questions with the rest of the team.

**Why this priority**: Adds collaboration on top of the existing board and task
model; valuable but not required for the board to function.

**Independent Test**: Open any task on any project board, add a comment as the
active user, and confirm the comment appears attributed to that user and persists
on reload.

**Acceptance Scenarios**:

1. **Given** an open task, **When** a user submits a comment, **Then** the comment
   appears on the task attributed to that user with a timestamp.
2. **Given** a task with existing comments, **When** a different predefined user
   opens the task, **Then** they see all prior comments in the order they were
   posted.
3. **Given** a comment the active user posted earlier, **When** they edit or
   delete it, **Then** the change is reflected with no page reload required
   and persists on reload.
4. **Given** a comment posted by a different user, **When** the active user
   views it, **Then** no edit or delete control is available to them for that
   comment.

---

### Edge Cases

- What happens when a project has zero tasks? The board MUST still render all four
  columns, empty.
- What happens when a task has no assignee? The task MUST display as unassigned
  rather than erroring or defaulting to a specific user, and any of the five
  users MUST be able to move it.
- What happens when a user who is not the task's assignee tries to move it? The
  system MUST block the move and indicate only the assignee can move the task.
- What happens when a task is moved directly from "To Do" to "Done", skipping
  intermediate columns? The move MUST be allowed.
- What happens when two users act on the same task at nearly the same time (e.g.,
  both move it)? The last update applied MUST be the one reflected on reload.
- What happens when a comment is submitted with empty text? The system MUST reject
  it and prompt for non-empty content.
- What happens when a user tries to edit or delete another user's comment? The
  system MUST block the action; no edit/delete control is shown for comments the
  active user did not author.
- What happens when a task is stuck with an absent/unavailable assignee? Any of
  the five users MUST be able to reassign or unassign it, so a task is never
  stuck because its mover-permission (FR-008) is tied to an unreachable
  assignee.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide exactly five predefined users at launch — one
  Product Manager and four Engineers — selectable as the active user without any
  login or password step.
- **FR-002**: System MUST allow switching the active user at any time without
  authentication.
- **FR-003**: System MUST pre-load three sample projects, each with sample tasks
  distributed across the four columns, visible immediately on first launch with no
  setup steps.
- **FR-004**: System MUST allow any of the five predefined users (Product
  Manager or Engineer) to create a new project by providing a project name.
  The name MUST be unique (case-insensitive) among existing projects; a
  request to create a project with a name that already exists MUST be
  rejected.
- **FR-005**: System MUST display a Kanban board for each project with exactly
  four columns, in this order: To Do, In Progress, In Review, Done.
- **FR-006**: Users MUST be able to create a task within a project, specifying a
  title (1–200 characters, required) and an optional description (up to 2000
  characters); new tasks start in the "To Do" column.
- **FR-007**: Any of the five users MUST be able to assign, reassign, or
  unassign any task — to exactly one of the five predefined users at a time, or
  to no one — regardless of who currently holds the task. This is deliberately
  unrestricted (unlike FR-008) so a task can never be stuck unmovable because
  its assignee is unavailable (see Edge Cases).
- **FR-008**: Only the task's current assignee MUST be able to move that task
  between columns (any column to any other, in any order, not restricted to
  sequential progression), evaluated at the time of the move request against
  the task's then-current assignee. If a task has no assignee, any of the five
  users MUST be able to move it.
- **FR-009**: Users MUST be able to add a comment to any task; each comment MUST
  record its author (one of the five predefined users) and the time it was
  posted. Comment text is 1–2000 characters; surrounding whitespace is trimmed
  before this limit and the empty-text check (FR-013) are applied.
- **FR-010**: System MUST display, for each task, its title, assignee (or
  "Unassigned"), and comments.
- **FR-011**: System MUST persist all project, task, assignment, column, and
  comment changes so that any user sees the latest state after reloading the
  application.
- **FR-012**: System MUST list all projects (sample and user-created) so a user
  can select which project's board to view.
- **FR-013**: System MUST reject comment submissions that are empty or
  whitespace-only (after trimming) and prompt the user for content.
- **FR-014**: A comment's author MUST be able to edit or delete that comment;
  no other user MUST be able to edit or delete it.

### Key Entities

- **User**: One of the five predefined identities. Attributes: name, role
  (Product Manager or Engineer). Fixed set of five for this phase; no sign-up or
  profile editing. The role is for identification/display only — it grants no
  extra or restricted capabilities in this phase (see Assumptions).
- **Project**: A container for tasks. Attributes: name, creation time. Starts
  with three sample projects; users can add more.
- **Task**: A unit of work within a project. Attributes: title, description
  (optional), current column (To Do / In Progress / In Review / Done), assignee
  (optional, one of the five users), creation time. Belongs to exactly one
  project.
- **Comment**: A note attached to a task. Attributes: text, author (one of the
  five users), posted time. Belongs to exactly one task.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select one of the five predefined identities and view a
  project's board within 5 seconds, with zero login steps.
- **SC-002**: All three sample projects, fully populated with tasks across
  columns, are visible immediately on first launch with no setup action required.
- **SC-003**: A user can move a task to a different column in a single
  interaction (e.g., one drag-and-drop or one control action).
- **SC-004**: 100% of task column changes, assignments, and comments are still
  visible, correctly attributed, in the same state after the page is reloaded.
- **SC-005**: A user can create a new project and add a task to it in under 1
  minute.
- **SC-006**: A user can post a comment on a task and see it attributed to them
  immediately, with no page reload required.
- **SC-007**: A user who attempts to move a task they are not assigned to sees
  the move rejected with a clear reason, with no page reload required.

## Assumptions

- No authentication/login is required for this phase; identity is selected from
  the five predefined users, and switching identity requires no credentials.
- All five users operate in a single shared workspace; there is no multi-team or
  multi-tenant separation in this phase.
- Task deletion and project deletion/archival are out of scope for this phase;
  tasks and projects persist once created.
- The Product Manager and Engineer roles are recorded for identification only
  in this phase; there are no role-based permission differences (nothing a PM
  can do that an Engineer can't, or vice versa). FR-008 and FR-014 restrict
  actions by assignment/authorship, not by role — e.g., any of the five could
  be blocked from moving a given task if someone else is its assignee.
- Real-time multi-user sync (e.g., live updates without reload) is out of scope
  for this phase; persistence across reloads (FR-011) is sufficient.
- Editing a comment (FR-014) does not need to show an "edited" indicator to
  other users in this phase; the comment simply displays its latest text.
- No concurrency-control mechanism (e.g., optimistic locking/version numbers)
  is required for this phase; simultaneous conflicting updates to the same
  task or comment are resolved by whichever write reaches storage last (see
  Edge Cases), which is acceptable at this team's scale.
