import { render, screen, within } from '@testing-library/react';
import { Board } from '../../src/components/Board/Board';
import type { TaskDto } from '../../src/services/api';

const USER_A = 'user-a';
const USER_B = 'user-b';

function task(overrides: Partial<TaskDto>): TaskDto {
  return {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Untitled',
    description: null,
    status: 'TODO',
    assigneeUserId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Board', () => {
  it('renders all 4 columns even when there are no tasks', () => {
    render(<Board tasks={[]} currentUserId={USER_A} onMove={() => {}} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('groups tasks under their current column', () => {
    const tasks = [
      task({ id: 't1', title: 'Task One', status: 'TODO' }),
      task({ id: 't2', title: 'Task Two', status: 'IN_PROGRESS' }),
      task({ id: 't3', title: 'Task Three', status: 'DONE' }),
    ];

    render(<Board tasks={tasks} currentUserId={USER_A} onMove={() => {}} />);

    const todoColumn = screen.getByTestId('column-TODO');
    const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
    const doneColumn = screen.getByTestId('column-DONE');

    expect(within(todoColumn).getByText('Task One')).toBeInTheDocument();
    expect(within(inProgressColumn).getByText('Task Two')).toBeInTheDocument();
    expect(within(doneColumn).getByText('Task Three')).toBeInTheDocument();
  });

  it("shows a task's assignee name or Unassigned", () => {
    const tasks = [
      task({ id: 't1', title: 'Assigned task', assigneeUserId: USER_B }),
      task({ id: 't2', title: 'Unassigned task', assigneeUserId: null }),
    ];

    render(
      <Board
        tasks={tasks}
        currentUserId={USER_A}
        onMove={() => {}}
        userNameById={{ [USER_B]: 'Jordan Lee' }}
      />,
    );

    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});
