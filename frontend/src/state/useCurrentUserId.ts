import { useSyncExternalStore } from 'react';
import { getCurrentUserId, subscribeCurrentUserId } from './currentUserStore';

export function useCurrentUserId(): string | null {
  return useSyncExternalStore(subscribeCurrentUserId, getCurrentUserId);
}
