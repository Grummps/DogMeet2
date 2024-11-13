const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/messageModel'); // Adjust the path as necessary
const getOrCreateConversation = require('./getOrCreateConvo');
const checkFriendship = require('../utilities/checkFriendship'); // Adjust the path as necessary
const Notification = require('../models/notificationModel');

const onlineUsers = new Map();
let io;

// Function to initialize Socket.IO
function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:8096',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });


    const usersInConversations = new Map(); // Key: userId, Value: Set of conversationIds


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

        // Initialize user's conversation set
        if (!usersInConversations.has(userId)) {
            usersInConversations.set(userId, new Set());
        }

        // Handle joinConversation event
        socket.on('joinConversation', async ({ conversationId, otherUserId }) => {
            const convSet = usersInConversations.get(userId);
            convSet.add(conversationId.toString());

            try {
                // Mark related notifications as read
                await Notification.updateMany(
                    {
                        type: 'message_received',
                        sender: otherUserId,
                        receiver: userId,
                        read: false,
                    },
                    { $set: { read: true } }
                );
            } catch (error) {
                console.error('Error marking notifications as read in joinConversation:', error);
            }
        });

        // Handle leaveConversation event
        socket.on('leaveConversation', ({ conversationId }) => {
            const convSet = usersInConversations.get(userId);
            convSet.delete(conversationId.toString());
        });

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
                const recipientIdStr = receiverId.toString();
                const recipientSocketId = onlineUsers.get(recipientIdStr);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('receiveMessage', message);
                }

                // Check if the recipient is currently viewing the conversation
                const isRecipientInConversation =
                    usersInConversations.has(recipientIdStr) &&
                    usersInConversations.get(recipientIdStr).has(conversation._id.toString());

                // Create a notification for the receiver if they're not in the conversation
                if (!isRecipientInConversation) {
                    // Check for existing unread notification
                    let notification = await Notification.findOne({
                        type: 'message_received',
                        sender: senderId,
                        receiver: receiverId,
                        read: false,
                    });

                    if (!notification) {
                        // Create a new notification
                        notification = new Notification({
                            type: 'message_received',
                            sender: senderId,
                            receiver: receiverId,
                            message: message._id,
                        });
                    } else {
                        // Update the existing notification's timestamp
                        notification.createdAt = Date.now();
                    }

                    await notification.save();

                    // Populate the sender field before emitting
                    const populatedNotification = await Notification.findById(notification._id)
                        .populate('sender', 'username');

                    // Emit new notification event to receiver if they're connected
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('newNotification', populatedNotification);
                    }
                }

                // Emit message to sender (confirmation)
                socket.emit('messageSent', message);
            } catch (error) {
                console.error('Error in sendMessage:', error);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // Handle markMessagesRead event (optional, if still used)
        socket.on('markMessagesRead', async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { readStatus: true } }
                );

                // Mark related notifications as read
                await Notification.updateMany(
                    {
                        type: 'message_received',
                        sender: senderId,
                        receiver: userId,
                        read: false,
                    },
                    { $set: { read: true } }
                );
            } catch (error) {
                console.error('Error in markMessagesRead:', error);
            }
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            onlineUsers.delete(userId.toString());
            usersInConversations.delete(userId);
        });
    });

    return io;
}

module.exports = { initializeSocket, getIo: () => io, onlineUsers };
