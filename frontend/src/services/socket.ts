import { io, Socket } from 'socket.io-client';
import { getCurrentUserId } from '../state/currentUserStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;
let hasConnectedBefore = false;
let disconnectedAt: string | null = null;
let joinedProjectId: string | null = null;

type ReconnectHandler = (projectId: string, since: string) => void;
const reconnectHandlers = new Set<ReconnectHandler>();

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      // socket.io-client calls a function-valued `auth` option AS A
      // CALLBACK (`this.auth((data) => ...)`) before each connection
      // attempt — it does NOT use a returned value. This must invoke `cb`.
      auth: (cb: (data: { userId: string | null }) => void) => cb({ userId: getCurrentUserId() }),
    });

    socket.on('disconnect', () => {
      disconnectedAt = new Date().toISOString();
    });

    // Socket.IO rooms do not survive a disconnect, so a reconnect must
    // re-join the room; before doing so, the client fills the gap via the
    // notifications catch-up endpoint (contracts/websocket-events.md §3).
    socket.on('connect', () => {
      if (hasConnectedBefore && joinedProjectId && disconnectedAt) {
        const since = disconnectedAt;
        const projectId = joinedProjectId;
        disconnectedAt = null;
        reconnectHandlers.forEach((handler) => handler(projectId, since));
      }
      hasConnectedBefore = true;
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const instance = getSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export interface JoinProjectAck {
  error?: string;
  tasks?: unknown[];
}

export function joinProject(projectId: string): Promise<JoinProjectAck> {
  joinedProjectId = projectId;
  return new Promise((resolve) => {
    connectSocket().emit('join:project', { projectId }, (ack: JoinProjectAck) => resolve(ack));
  });
}

export function leaveProject(projectId: string): void {
  if (joinedProjectId === projectId) {
    joinedProjectId = null;
  }
  if (socket?.connected) {
    socket.emit('leave:project', { projectId });
  }
}

export function onEvent(event: string, handler: (payload: unknown) => void): () => void {
  const instance = connectSocket();
  instance.on(event, handler);
  return () => instance.off(event, handler);
}

// Fires when the socket reconnects after a drop while a project room was
// joined, with the timestamp the connection was lost — the caller is
// responsible for fetching the notifications catch-up and re-joining.
export function onReconnect(handler: ReconnectHandler): () => void {
  reconnectHandlers.add(handler);
  return () => reconnectHandlers.delete(handler);
}
