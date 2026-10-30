import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Column } from '../Column/Column';
import { TaskCard } from '../TaskCard/TaskCard';
import type { TaskDto, TaskStatus, UserDto } from '../../services/api';

const COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'IN_REVIEW', title: 'In Review' },
  { status: 'DONE', title: 'Done' },
];

export interface BoardProps {
  tasks: TaskDto[];
  currentUserId: string;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  userNameById?: Record<string, string>;
  moveError?: string | null;
  users?: UserDto[];
  onReassign?: (taskId: string, assigneeUserId: string | null) => void;
  onOpenTask?: (taskId: string) => void;
}

function canMoveTask(task: TaskDto, currentUserId: string): boolean {
  return task.assigneeUserId === null || task.assigneeUserId === currentUserId;
}

export function Board({
  tasks,
  currentUserId,
  onMove,
  userNameById,
  moveError,
  users,
  onReassign,
  onOpenTask,
}: BoardProps) {
  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const newStatus = event.over?.id as TaskStatus | undefined;
    if (!newStatus) {
      return;
    }
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) {
      return;
    }
    onMove(taskId, newStatus);
  }

  return (
    <div>
      {moveError ? <div className="board-error">{moveError}</div> : null}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="board">
          {COLUMNS.map((column) => (
            <Column key={column.status} status={column.status} title={column.title}>
              {tasks
                .filter((task) => task.status === column.status)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assigneeName={task.assigneeUserId ? userNameById?.[task.assigneeUserId] : undefined}
                    canMove={canMoveTask(task, currentUserId)}
                    users={users}
                    onReassign={onReassign ? (assigneeUserId) => onReassign(task.id, assigneeUserId) : undefined}
                    onOpen={onOpenTask ? () => onOpenTask(task.id) : undefined}
                  />
                ))}
            </Column>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
