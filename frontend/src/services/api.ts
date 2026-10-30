import { getCurrentUserId } from '../state/currentUserStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const userId = getCurrentUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body as { error?: string; message?: string } | null;
    throw new ApiError(error?.error ?? 'UNKNOWN_ERROR', error?.message ?? 'Request failed.', response.status);
  }

  return body as T;
}

export interface UserDto {
  id: string;
  name: string;
  role: 'PRODUCT_MANAGER' | 'ENGINEER';
}

export interface ProjectDto {
  id: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  taskId: string;
  authorUserId: string;
  text: string;
  createdAt: string;
  updatedAt: string | null;
}

export const api = {
  listUsers: () => request<UserDto[]>('/users'),

  listProjects: () => request<ProjectDto[]>('/projects'),
  getProject: (projectId: string) => request<ProjectDto>(`/projects/${projectId}`),
  createProject: (name: string) =>
    request<ProjectDto>('/projects', { method: 'POST', body: JSON.stringify({ name }) }),

  listTasks: (projectId: string) => request<TaskDto[]>(`/projects/${projectId}/tasks`),
  getTask: (taskId: string) => request<TaskDto & { comments: CommentDto[] }>(`/tasks/${taskId}`),
  createTask: (projectId: string, data: { title: string; description?: string; assigneeUserId?: string }) =>
    request<TaskDto>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId: string, data: { status?: TaskStatus; assigneeUserId?: string | null }) =>
    request<TaskDto>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  addComment: (taskId: string, text: string) =>
    request<CommentDto>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  editComment: (commentId: string, text: string) =>
    request<CommentDto>(`/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
  deleteComment: (commentId: string) => request<void>(`/comments/${commentId}`, { method: 'DELETE' }),

  getNotificationsSince: (projectId: string, since?: string) =>
    request<unknown[]>(`/projects/${projectId}/notifications${since ? `?since=${encodeURIComponent(since)}` : ''}`),
};
