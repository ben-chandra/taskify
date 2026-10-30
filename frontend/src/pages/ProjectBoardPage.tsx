import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Board } from '../components/Board/Board';
import { CreateTaskModal } from '../components/CreateTaskModal/CreateTaskModal';
import { CommentThread } from '../components/CommentThread/CommentThread';
import { api, ApiError, type TaskDto, type TaskStatus } from '../services/api';
import { useCurrentUserId } from '../state/useCurrentUserId';
import { joinProject, leaveProject, onEvent, onReconnect } from '../services/socket';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const currentUserId = useCurrentUserId();
  const queryClient = useQueryClient();
  const [moveError, setMoveError] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const tasksQueryKey = useMemo(() => ['tasks', projectId], [projectId]);

  const { data: tasks } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => api.listTasks(projectId!),
    enabled: !!projectId,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: api.listUsers });
  const userNameById = useMemo(
    () => Object.fromEntries((users ?? []).map((u) => [u.id, u.name])),
    [users],
  );

  useEffect(() => {
    if (!projectId) return;

    joinProject(projectId).then((ack) => {
      if (ack.tasks) {
        queryClient.setQueryData(tasksQueryKey, ack.tasks);
      }
    });

    const unsubscribers = [
      onEvent('task:created', () => queryClient.invalidateQueries({ queryKey: tasksQueryKey })),
      onEvent('task:moved', () => queryClient.invalidateQueries({ queryKey: tasksQueryKey })),
      onEvent('task:assigned', () => queryClient.invalidateQueries({ queryKey: tasksQueryKey })),
      onEvent('task:unassigned', () => queryClient.invalidateQueries({ queryKey: tasksQueryKey })),
      onReconnect((reconnectedProjectId, since) => {
        if (reconnectedProjectId !== projectId) return;
        // Fill the gap from the catch-up feed, then re-join the room (Socket.IO
        // rooms don't survive a disconnect) and refresh everything this page shows.
        api.getNotificationsSince(reconnectedProjectId, since).finally(() => {
          joinProject(reconnectedProjectId).then((ack) => {
            if (ack.tasks) {
              queryClient.setQueryData(tasksQueryKey, ack.tasks);
            }
          });
          queryClient.invalidateQueries({ queryKey: tasksQueryKey });
          queryClient.invalidateQueries({ queryKey: ['task'] });
        });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      leaveProject(projectId);
    };
  }, [projectId, queryClient, tasksQueryKey]);

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.updateTask(taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      setMoveError(null);
      const previous = queryClient.getQueryData<TaskDto[]>(tasksQueryKey);
      queryClient.setQueryData<TaskDto[]>(tasksQueryKey, (current) =>
        current?.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tasksQueryKey, context.previous);
      }
      setMoveError(
        error instanceof ApiError && error.code === 'NOT_ASSIGNEE'
          ? "Only this task's assignee can move it."
          : 'Could not move the task. Please try again.',
      );
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ taskId, assigneeUserId }: { taskId: string; assigneeUserId: string | null }) =>
      api.updateTask(taskId, { assigneeUserId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });

  if (!projectId || !currentUserId) {
    return null;
  }

  return (
    <div className="board-page">
      <div className="modal-actions">
        <button type="button" onClick={() => setShowCreateTask(true)}>
          New Task
        </button>
      </div>
      <Board
        tasks={tasks ?? []}
        currentUserId={currentUserId}
        onMove={(taskId, status) => moveMutation.mutate({ taskId, status })}
        onReassign={(taskId, assigneeUserId) => reassignMutation.mutate({ taskId, assigneeUserId })}
        onOpenTask={(taskId) => setOpenTaskId(taskId)}
        userNameById={userNameById}
        users={users}
        moveError={moveError}
      />
      {showCreateTask ? (
        <CreateTaskModal projectId={projectId} onClose={() => setShowCreateTask(false)} />
      ) : null}
      {openTaskId ? (
        <TaskDetail taskId={openTaskId} userNameById={userNameById} onClose={() => setOpenTaskId(null)} />
      ) : null}
    </div>
  );
}

function TaskDetail({
  taskId,
  userNameById,
  onClose,
}: {
  taskId: string;
  userNameById: Record<string, string>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: task } = useQuery({ queryKey: ['task', taskId], queryFn: () => api.getTask(taskId) });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    const unsubscribers = [
      onEvent('comment:added', invalidate),
      onEvent('comment:edited', invalidate),
      onEvent('comment:deleted', invalidate),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [taskId, queryClient]);

  return (
    <div className="task-detail-backdrop" onClick={onClose}>
      <div className="task-detail" onClick={(e) => e.stopPropagation()}>
        <h3>{task?.title ?? 'Loading…'}</h3>
        {task?.description ? <p>{task.description}</p> : null}
        {task ? (
          <CommentThread taskId={taskId} comments={task.comments} userNameById={userNameById} />
        ) : null}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
