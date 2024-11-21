module.exports = (io, socket, onlineUsers) => {
    // Listen for message events from the client
    socket.on('sendMessage', async (messageData) => {
        io.emit('sendMessage', messageData);
    });

    // Additional message-related events can be handled here
};
