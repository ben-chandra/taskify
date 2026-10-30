import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentUserId } from '../../state/useCurrentUserId';
import { setCurrentUserId } from '../../state/currentUserStore';

export function UserSwitcher() {
  const currentUserId = useCurrentUserId();
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.listUsers,
  });

  if (isLoading || !users) {
    return <div className="user-switcher">Loading users…</div>;
  }

  return (
    <label className="user-switcher">
      Acting as:{' '}
      <select
        value={currentUserId ?? ''}
        onChange={(event) => setCurrentUserId(event.target.value || null)}
      >
        <option value="" disabled>
          Select a user…
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role === 'PRODUCT_MANAGER' ? 'PM' : 'Engineer'})
          </option>
        ))}
      </select>
    </label>
  );
}
