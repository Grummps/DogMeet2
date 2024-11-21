const { Server } = require('socket.io');

// Socket.IO instance
let io;
const onlineUsers = new Map();

// Import event handlers
const messageHandler = require('./messageHandler');
const notificationHandler = require('./notificationHandler');

function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_ORIGIN || 'http://localhost:8096',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Handle user identification
        socket.on("userConnected", (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.userId = userId;
            console.log(`User ${userId} connected with socket ID ${socket.id}`);
        });

        // Handle joining chat rooms
        socket.on("joinChatRoom", (chatRoomId) => {
            socket.join(chatRoomId);
            console.log(`Socket ${socket.id} joined chat room ${chatRoomId}`);
        });

        // Attach message-related event handlers
        messageHandler(io, socket, onlineUsers);

        // Attach notification-related event handlers
        notificationHandler(io, socket, onlineUsers);

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected`);
            }
        });
    });

    return io;
}

module.exports = { initializeSocket, getIo: () => io, onlineUsers };
