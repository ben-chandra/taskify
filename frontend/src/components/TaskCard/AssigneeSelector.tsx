import type { UserDto } from '../../services/api';

export interface AssigneeSelectorProps {
  users: UserDto[];
  assigneeUserId: string | null;
  onChange: (assigneeUserId: string | null) => void;
}

export function AssigneeSelector({ users, assigneeUserId, onChange }: AssigneeSelectorProps) {
  return (
    <select
      aria-label="Assignee"
      value={assigneeUserId ?? ''}
      // Any of the 5 users may reassign/unassign any task (FR-007) — no
      // restriction here, unlike the drag-to-move permission on TaskCard.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
