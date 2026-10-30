import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../services/api';

export interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.createProject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (err) => {
      setError(
        err instanceof ApiError && err.code === 'PROJECT_NAME_TAKEN'
          ? 'A project with this name already exists.'
          : 'Could not create the project.',
      );
    },
  });

  return (
    <div className="modal-backdrop" role="dialog" aria-label="Create project">
      <div className="modal">
        <h3>New Project</h3>
        <input
          autoFocus
          placeholder="Project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {error ? <div className="board-error">{error}</div> : null}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={name.trim().length === 0 || mutation.isPending}
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
