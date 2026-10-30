import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
}

export function CreateTaskModal({ projectId, onClose }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const queryClient = useQueryClient();

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: api.listUsers });

  const mutation = useMutation({
    mutationFn: () =>
      api.createTask(projectId, {
        title,
        description: description || undefined,
        assigneeUserId: assigneeUserId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      onClose();
    },
  });

  return (
    <div className="modal-backdrop" role="dialog" aria-label="Create task">
      <div className="modal">
        <h3>New Task</h3>
        <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
          <option value="">Unassigned</option>
          {(users ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={title.trim().length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
