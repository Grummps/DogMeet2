module.exports = (io, socket, onlineUsers) => {
    // Listen for 'sendMessage' events from the client
    socket.on('sendMessage', async (messageData) => {
        // Broadcast 'newMessage' to all clients except the sender
        socket.broadcast.emit('newMessage', messageData);
        // Optionally, emit 'newMessage' to the sender if needed
        io.to(socket.id).emit('newMessage', messageData);
    });

    socket.on('messageRead', async (messageIds) => {
        io.emit('messageRead', messageIds);
    });

    // Remove the 'newMessage' listener to prevent duplication
    // socket.on('newMessage', async (messageData) => {
    //     io.emit('newMessage', messageData);
    // });
    // Additional message-related events can be handled here
};
