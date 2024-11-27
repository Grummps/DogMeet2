module.exports = (io, socket, onlineUsers) => {
    // Listen for 'sendMessage' events from the client
    // Handle sending a message
    socket.on("sendMessage", (message) => {
        const { chatRoomId } = message;
        io.to(chatRoomId).emit("newMessage", message);
        console.log(`Message sent to chat room ${chatRoomId}:`, message);
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
