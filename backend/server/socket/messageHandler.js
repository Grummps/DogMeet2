module.exports = (io, socket, onlineUsers) => {
    // Listen for message events from the client
    socket.on('sendMessage', async (messageData) => {
        io.emit('sendMessage', messageData);
    });

    socket.on('messageRead', async (messageIds) => {
        io.emit('messageRead', messageIds);
    });

    // Additional message-related events can be handled here
};
