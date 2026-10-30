const STORAGE_KEY = 'taskify.currentUserId';

let currentUserId: string | null = localStorage.getItem(STORAGE_KEY);
const listeners = new Set<() => void>();

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem(STORAGE_KEY, userId);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCurrentUserId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
