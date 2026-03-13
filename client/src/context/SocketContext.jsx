import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { C2S } from 'shared/protocol.js';

const SocketContext = createContext(null);

function getSessionId() {
  let id = localStorage.getItem('catan_sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('catan_sessionId', id);
  }
  return id;
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      auth: { sessionId: sessionId.current }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Try to rejoin previous session
      socket.emit(C2S.REJOIN, { sessionId: sessionId.current });
    });

    socket.on('disconnect', () => setConnected(false));

    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, sessionId: sessionId.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
