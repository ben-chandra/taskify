import { useDraggable } from '@dnd-kit/core';
import type { TaskDto, UserDto } from '../../services/api';
import { AssigneeSelector } from './AssigneeSelector';

export interface TaskCardProps {
  task: TaskDto;
  assigneeName: string | undefined;
  canMove: boolean;
  users?: UserDto[];
  onReassign?: (assigneeUserId: string | null) => void;
  onOpen?: () => void;
}

export function TaskCard({ task, assigneeName, canMove, users, onReassign, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canMove,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${isDragging ? ' is-dragging' : ''}${!canMove ? ' is-locked' : ''}`}
      onClick={onOpen}
    >
      <div className="task-card-header">
        <h4>{task.title}</h4>
        {/* Drag listeners live only on this handle, never on the card body
            or title — dnd-kit's pointer sensor otherwise swallows the click
            that would open the task detail view. */}
        {canMove ? (
          <span
            className="drag-handle"
            aria-label="Drag to move"
            title="Drag to move this task"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            ⠿
          </span>
        ) : (
          <span className="drag-handle is-locked" title="Only this task's assignee can move it">
            🔒
          </span>
        )}
      </div>
      <div className="assignee" onClick={(event) => event.stopPropagation()}>
        {users && onReassign ? (
          <AssigneeSelector users={users} assigneeUserId={task.assigneeUserId} onChange={onReassign} />
        ) : (
          assigneeName ?? 'Unassigned'
        )}
      </div>
    </div>
  );
}
