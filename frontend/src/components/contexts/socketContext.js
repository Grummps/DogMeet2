import React, { createContext } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:8081', {
    auth: {
      token: localStorage.getItem('accessToken'),
    },
  });

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
