import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URI, {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
  transports: ['websocket'],
});

export const connectSocket = (userId) => {
  if (socket.disconnected) {
    socket.connect();
  }
  socket.emit('userConnected', userId);
};

export default socket;
