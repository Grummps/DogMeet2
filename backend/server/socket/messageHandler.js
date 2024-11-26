module.exports = (io, socket, onlineUsers) => {
    // Listen for message events from the client
    socket.on('sendMessage', async (messageData) => {
        io.emit('sendMessage', messageData);
    });

    socket.on('messageRead', async (messageIds) => {
        io.emit('messageRead', messageIds);
    });

    socket.on('newMessage', async (messageData) => {
        io.emit('newMessage', messageData);
    });
    // Additional message-related events can be handled here
};
