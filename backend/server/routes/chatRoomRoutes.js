const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticate = require('../middleware/auth');
const chatRoomModel = require('../models/chatRoomModel');
const User = require('../models/userModel');

router.post("/", authenticate, async (req, res) => {
    const { participants } = req.body;

    if (
        !participants ||
        !Array.isArray(participants) ||
        participants.length !== 2
    ) {
        return res.status(400).json({ message: "2 Participants are required." });
    }

    const [participant1, participant2] = participants;

    if (!participant1.userId || !participant2.userId) {
        return res.status(400).json({ message: "Participants must have userId." });
    }

    for (let participant of participants) {
        const userExists = await User.exists({ _id: participant.userId });
        if (!userExists) {
            return res
                .status(404)
                .json({ message: `User with ID ${participant.userId} not found.` });
        }
    }

    // Find existing chat room between participants (even if hidden)
    let chatRoom = await chatRoomModel.findOne({
        "participants.userId": { $all: participants.map((p) => p.userId) },
    });

    if (chatRoom) {
        // Remove the user from hiddenTo array if present
        const userId = req.user._id;
        if (chatRoom.hiddenTo.includes(userId)) {
            chatRoom.hiddenTo = chatRoom.hiddenTo.filter(
                (id) => id.toString() !== userId.toString()
            );
            await chatRoom.save();
        }

        return res.json({
            message: "Chat room already exists",
            chatRoom: chatRoom,
        });
    }

    // Create a new chat room
    const newChatRoom = new chatRoomModel({
        participants: participants.map((participant) => ({
            userId: participant.userId,
            firstMessageId: participant.firstMessageId || null,
        })),
    });

    try {
        const response = await newChatRoom.save();
        res
            .status(201)
            .json({ message: "Chat room created successfully", chatRoom: response });
    } catch (err) {
        console.error("Error creating chat room:", err);
        res.status(500).json({ error: "Could not create chat room" });
    }
});


// POST /api/chatrooms/hide/:id
router.post('/hide/:id', authenticate, async (req, res) => {
    const chatRoomId = req.params.id;
    const userId = req.user._id;

    // Validate chatRoomId
    if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
        return res.status(400).json({ message: "Invalid chat room ID format." });
    }

    try {
        // Fetch the chat room
        const chatRoom = await chatRoomModel.findById(chatRoomId);

        if (!chatRoom) {
            return res.status(404).json({ message: "Chat room not found." });
        }

        // Check if the user is a participant
        const isParticipant = chatRoom.participants.some(
            participant => participant.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not authorized to hide this chat room." });
        }

        // Add user to hiddenTo array if not already present
        if (!chatRoom.hiddenTo.includes(userId)) {
            chatRoom.hiddenTo.push(userId);
            await chatRoom.save();
        }

        res.json({ message: "Chat room hidden successfully." });
    } catch (err) {
        console.error("Error hiding chat room:", err);
        res.status(500).json({ error: "Could not hide chat room" });
    }
});

// DELETE /api/chatrooms/:id
router.delete('/:_id', authenticate, async (req, res) => {
    const chatRoomId = req.params._id;
    const userId = req.user._id; // Assuming the authenticate middleware sets req.user

    // Validate chatRoomId
    if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
        return res.status(400).json({ message: "Invalid chat room ID format." });
    }

    try {
        // Fetch the chat room
        const chatRoom = await chatRoomModel.findById(chatRoomId);

        if (!chatRoom) {
            return res.status(404).json({ message: "Chat room not found." });
        }

        // Check if the user is a participant
        const isParticipant = chatRoom.participants.some(
            participant => participant.userId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "You are not authorized to delete this chat room." });
        }

        // If it's a group chat, only the admin can delete it
        if (chatRoom.isGroup) {
            if (chatRoom.groupAdmin.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Only the group admin can delete this chat room." });
            }
        }

        // Delete the chat room
        await chatRoomModel.findByIdAndDelete(chatRoomId);

        res.json({ message: "Chat room deleted successfully." });
    } catch (err) {
        console.error("Error deleting chat room:", err);
        res.status(500).json({ error: "Could not delete chat room" });
    }
});

router.get("/getByUserId/:_id", authenticate, async (req, res) => {
    const { _id } = req.params;

    // Validate that _id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: "Invalid _id format." });
    }

    try {
        // Check if the user exists
        const userExists = await User.exists({ _id });
        if (!userExists) {
            return res.status(404).json({ message: `User with ID ${_id} not found.` });
        }

        // Fetch chat rooms where the user is a participant and not hidden
        const chatRooms = await chatRoomModel
            .find({
                "participants": { $elemMatch: { userId: _id } },
                hiddenTo: { $ne: _id },
            })
            .lean();

        if (!chatRooms || chatRooms.length === 0) {
            return res.json({ message: "No chat room found.", chatRooms: [] });
        }

        // Respond with the found chat rooms
        return res.json({ chatRooms });
    } catch (err) {
        console.error("Error fetching chat rooms:", err);
        res.status(500).json({ error: "Could not fetch chat rooms" });
    }
});


module.exports = router;