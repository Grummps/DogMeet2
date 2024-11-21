import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_SERVER_URI, {
  auth: {
    token: localStorage.getItem('accessToken'), // Include authentication token if required
  },
  autoConnect: false, // Prevent automatic connection
});

let isConnected = false;

export const connectSocket = (userId) => {
  if (!isConnected) {
    socket.connect();
    isConnected = true;
    // Identify the user to the server
    socket.emit('userConnected', userId);
  }
};

export default socket;