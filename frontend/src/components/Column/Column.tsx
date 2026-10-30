import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { TaskStatus } from '../../services/api';

export interface ColumnProps {
  status: TaskStatus;
  title: string;
  children: ReactNode;
}

export function Column({ status, title, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="column" data-testid={`column-${status}`}>
      <h3>{title}</h3>
      <div ref={setNodeRef} className={`column-dropzone${isOver ? ' is-over' : ''}`}>
        {children}
      </div>
    </div>
  );
}
