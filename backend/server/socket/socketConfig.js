const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/messageModel'); // Adjust the path as necessary
const getOrCreateConversation = require('./getOrCreateConvo');
const checkFriendship = require('../utilities/checkFriendship'); // Adjust the path as necessary

// Function to initialize Socket.IO
function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:8096',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    const onlineUsers = new Map();

    // Socket.IO authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log('Socket authentication failed: Token missing');
            const err = new Error('Authentication error');
            err.data = { message: 'Authentication token missing.' };
            return next(err);
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (!decoded._id) {
                throw new Error('Token payload invalid: userId missing.');
            }
            socket.user = decoded;
            next();
        } catch (error) {
            console.error('Socket token verification failed:', error.message);
            const err = new Error('Authentication error');
            err.data = { message: 'Invalid or expired token.' };
            return next(err);
        }
    });

    // Socket.IO connection handler
    io.on('connection', (socket) => {
        const userId = socket.user._id;
        console.log(`User connected: ${socket.id}, User ID: ${userId}`);

        // Add user to online users map
        onlineUsers.set(userId.toString(), socket.id);

        // Join user to a room based on their user ID
        socket.join(userId);

        // Handle sendMessage event
        socket.on('sendMessage', async (data) => {
            const { receiverId, content } = data;
            const senderId = userId;

            try {
                // Check if the sender and receiver are friends
                const isFriend = await checkFriendship(senderId, receiverId);
                if (!isFriend) {
                    return socket.emit('error', { message: 'You are not friends with this user.' });
                }

                // Get or create conversation
                const conversation = await getOrCreateConversation([senderId, receiverId]);

                // Save message to database
                const message = new Message({
                    senderId,
                    receiverId,
                    content,
                    conversationId: conversation._id,
                });
                await message.save();

                // Update conversation's last message and timestamp
                conversation.lastMessage = message._id;
                conversation.updatedAt = Date.now();
                await conversation.save();

                // Emit message to receiver if they're connected
                const recipientSocketId = onlineUsers.get(receiverId.toString());

                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('receiveMessage', message);
                }

                // Emit message to sender (confirmation)
                socket.emit('messageSent', message);
            } catch (error) {
                console.error('Error in sendMessage:', error);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // Handle markMessagesRead event
        socket.on('markMessagesRead', async (messageIds) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { readStatus: true } }
                );
            } catch (error) {
                console.error('Error in markMessagesRead:', error);
            }
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            onlineUsers.delete(userId.toString());
        });
    });

    return io;
}

module.exports = { 
    initializeSocket,
    io,
};