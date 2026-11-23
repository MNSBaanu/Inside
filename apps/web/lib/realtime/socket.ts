'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/api/client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let authRetries = 0;

export function getSocket(): Socket {
  if (socket) return socket;
  const created = io(baseUrl, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    auth: (cb) => {
      void getAccessToken().then((token) => cb({ token: token ?? '' }));
    },
  });
  created.on('connect', () => {
    authRetries = 0;
  });
  created.on('connect_error', (error) => {
    if (error.message !== 'unauthorized' || authRetries >= 2) return;
    authRetries += 1;
    created.connect();
  });
  socket = created;
  return created;
}

export function connectSocket() {
  const current = getSocket();
  if (!current.connected) current.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
}

/** Runs the handler whenever the server sends this event. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    const current = getSocket();
    const listener = (payload: T) => latest.current(payload);
    current.on(event, listener);
    return () => {
      current.off(event, listener);
    };
  }, [event]);
}
