module.exports = (io, socket, onlineUsers) => {
    // Listen for message events from the client
    socket.on('sendMessage', async (messageData) => {
        const { chatRoomId, senderId, receiverId, content, isRead } = messageData;

        // Basic validation
        if (!chatRoomId || !senderId || !receiverId || !content) {
            return; // Optionally, emit an error back to the client
        }

        try {
            // Save the message to the database
            const Message = require('../../models/messageModel');
            const newMessage = new Message({
                chatRoomId,
                senderId,
                receiverId,
                content,
                isRead: isRead || false,
            });

            const savedMessage = await newMessage.save();

            // Emit the newMessage event to all clients in the chat room
            io.to(chatRoomId.toString()).emit('newMessage', savedMessage);
            console.log(`Emitted newMessage to room ${chatRoomId}:`, savedMessage);
        } catch (error) {
            console.error("Error in sendMessage handler:", error);
            // Optionally, emit an error back to the client
        }
    });

    // Additional message-related events can be handled here
};
