const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const Message = require('../models/messageModel');
const checkFriendship = require('../utilities/checkFriendship');
const chatRoomModel = require('../models/chatRoomModel');
const User = require('../models/userModel');
const { getIo } = require('../socket/socketConfig')

// POST: Create a new message
router.post("/", authenticate, async (req, res) => {
    const { chatRoomId, senderId, receiverId, content, isRead } = req.body;

    if (!chatRoomId || !senderId || !receiverId || !content) {
        return res.status(400).json({
            message: "chatRoomId, senderId, receiverId and content are required.",
        });
    }

    if (content.trim() === "")
        return res.status(400).json({ message: "content is required." });

    try {
        const chatRoomExists = await chatRoomModel.exists({ _id: chatRoomId });
        if (!chatRoomExists)
            return res
                .status(404)
                .json({ message: `Chat room with ID ${chatRoomId} not found.` });

        const senderExists = await User.exists({ _id: senderId });
        if (!senderExists)
            return res
                .status(404)
                .json({ message: `Sender with ID ${senderId} not found.` });

        const receiverExists = await User.exists({ _id: receiverId });
        if (!receiverExists)
            return res
                .status(404)
                .json({ message: `Receiver with ID ${receiverId} not found.` });

        const newMessage = new Message({
            chatRoomId,
            senderId,
            receiverId,
            content,
            isRead: isRead || false,
        });

        const savedMessage = await newMessage.save();

        // Fetch the chat room
        const chatRoom = await chatRoomModel.findById(chatRoomId);

        if (!chatRoom) {
            return res.status(404).json({ message: "Chat room not found." });
        }

        // Remover receiver from hiddenTo array if they are in it
        if (chatRoom.hiddenTo.includes(receiverId)) {
            chatRoom.hiddenTo = chatRoom.hiddenTo.filter(
                (id) => id.toString() !== receiverId.toString()
            );
            await chatRoom.save();
        }

        // Emit the message via Socket.IO
        const io = getIo();
        io.to(chatRoomId.toString()).emit('newMessage', savedMessage);
        console.log(`Emitted newMessage to room ${chatRoomId}:`, savedMessage);
        // Optionally, emit a notification to the receiver
        // You can implement notification logic here

        res.status(201).json({
            message: "Message created successfully",
            data: savedMessage,
        });
    } catch (err) {
        console.error("Error creating message:", err);
        res.status(500).json({ error: "Could not create message" });
    }
});

router.post("/lastMessage", authenticate, async (req, res) => {
    const { chatRoomIds } = req.body;

    if (!Array.isArray(chatRoomIds)) {
        return res.status(400).json({ message: "Chat Room IDs are required." });
    }

    if (chatRoomIds.length === 0) {
        return res.status(200).json({ data: [] });
    }

    try {
        const chatRooms = await chatRoomModel
            .find({ _id: { $in: chatRoomIds } })
            .lean();
        if (chatRooms.length === 0) {
            return res.status(404).json({ message: "No chat rooms found." });
        }

        const lastMessages = await Promise.all(
            chatRoomIds.map(async (chatRoomId) => {
                const lastMessage = await Message
                    .findOne({ chatRoomId })
                    .sort({ timestamp: -1 })
                    .lean();

                if (lastMessage) return lastMessage;
                else return { chatRoomId };
            })
        );

        return res.status(200).json({ data: lastMessages });
    } catch (error) {
        console.error("Error fetching last messages:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.put("/markAsRead", authenticate, async (req, res) => {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds)) {
        return res.status(400).json({ message: "Message IDs are required." });
    }

    if (messageIds.length === 0) {
        return res
            .status(200)
            .json({ message: "Messages are marked as read successfully." });
    }

    try {
        const messages = await Message
            .find({ _id: { $in: messageIds } })
            .lean();

        if (messages.length === 0) {
            return res.status(404).json({ message: "No messages found" });
        }

        await Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { isRead: true } }
        );

        // Emit messageRead event for each message
        const io = getIo();
        for (const messageId of messageIds) {
            const message = await Message.findById(messageId).lean();
            if (message && message.chatRoomId) {
                io.to(message.chatRoomId.toString()).emit('messageRead', [messageId]);
            }
        }

        return res
            .status(200)
            .json({ message: "Messages are marked as read successfully." });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.get("/getByChatRoomId/:chatRoomId", authenticate, async (req, res) => {
    const { chatRoomId } = req.params;

    if (!chatRoomId) {
        return res.status(400).json({ message: "ChatRoomId is required." });
    }

    try {
        const roomExists = await chatRoomModel.exists({ _id: chatRoomId });
        if (!roomExists) {
            return res
                .status(404)
                .json({ message: `ChatRoomId with ID ${chatRoomId} not found.` });
        }

        const messages = await Message.find({ chatRoomId }).lean();

        return res.json({ data: messages });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Could not fetch messages" });
    }
}
);

router.get("/getByUserId/:_id", authenticate, async (req, res) => {
    const { _id } = req.params;

    if (!_id) {
        return res.status(400).json({ message: "_id is required." });
    }

    try {
        const userExists = await User.exists({ _id });
        if (!userExists) {
            return res
                .status(404)
                .json({ message: `User with ID ${_id} not found.` });
        }

        const messages = await Message
            .find({
                $or: [{ receiverId: _id }, { senderId: _id }],
            })
            .lean();

        return res.json({ data: messages });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Could not fetch messages" });
    }
});

router.get("/unreadMessage/getByUserId/:_id", authenticate, async (req, res) => {
    const { _id } = req.params;

    if (!_id) {
        return res.status(400).json({ message: "_id is required." });
    }

    try {
        const userExists = await User.exists({ _id });
        if (!userExists) {
            return res
                .status(404)
                .json({ message: `User with ID ${userId} not found.` });
        }

        const messages = await Message
            .find({ receiverId: _id, isRead: false })
            .lean();

        return res.json({ data: messages });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Could not fetch messages" });
    }
}
);



module.exports = router;
