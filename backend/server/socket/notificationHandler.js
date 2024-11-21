module.exports = (io, socket, onlineUsers) => {
    // Listen for notification events
    socket.on('sendNotification', (notificationData) => {
        const { recipientId, notification } = notificationData;

        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
            // Emit the notification to the recipient if online
            io.to(recipientSocketId).emit('newNotification', notification);
        }
        // Optionally, handle notification persistence if needed
        // ...
    });

    // Additional notification-related events can be handled here
};
