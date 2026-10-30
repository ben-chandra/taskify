import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CommentDto } from '../../services/api';
import { useCurrentUserId } from '../../state/useCurrentUserId';

export interface CommentThreadProps {
  taskId: string;
  comments: CommentDto[];
  userNameById: Record<string, string>;
}

export function CommentThread({ taskId, comments, userNameById }: CommentThreadProps) {
  const currentUserId = useCurrentUserId();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['task', taskId] });

  const addMutation = useMutation({
    mutationFn: () => api.addComment(taskId, text),
    onSuccess: () => {
      setText('');
      invalidate();
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ commentId, newText }: { commentId: string; newText: string }) =>
      api.editComment(commentId, newText),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => api.deleteComment(commentId),
    onSuccess: invalidate,
  });

  return (
    <div className="comment-thread">
      <h4>Comments</h4>
      {comments.map((comment) => {
        const isAuthor = comment.authorUserId === currentUserId;
        const isEditing = editingId === comment.id;

        return (
          <div className="comment" key={comment.id}>
            <div className="comment-meta">
              <span>
                {userNameById[comment.authorUserId] ?? 'Unknown'} ·{' '}
                {new Date(comment.createdAt).toLocaleString()}
              </span>
              {isAuthor ? (
                <span className="comment-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingText(comment.text);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteMutation.mutate(comment.id)}>
                    Delete
                  </button>
                </span>
              ) : null}
            </div>
            {isEditing ? (
              <div>
                <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                <div className="modal-actions">
                  <button type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={editingText.trim().length === 0}
                    onClick={() => editMutation.mutate({ commentId: comment.id, newText: editingText })}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p>{comment.text}</p>
            )}
          </div>
        );
      })}

      <div className="modal-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <textarea
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          disabled={text.trim().length === 0 || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          Post comment
        </button>
      </div>
    </div>
  );
}
