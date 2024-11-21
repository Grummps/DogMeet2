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

    const chatRoom = await chatRoomModel.findOne({
        "participants.userId": { $all: participants.map((p) => p.userId) },
    });

    if (chatRoom)
        return res.json({
            message: "Chat room already exists",
            chatRoom: chatRoom,
        });

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

        // Fetch chat rooms where the user is a participant
        const chatRooms = await chatRoomModel
            .find({
                "participants": { $elemMatch: { userId: _id } }, // Corrected query for nested structure
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