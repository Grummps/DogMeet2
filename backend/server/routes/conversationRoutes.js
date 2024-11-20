const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth'); 
const Conversation = require('../models/conversationModel'); 
const mongoose = require('mongoose'); // For ObjectId conversions

// POST /conversations
router.post('/', authenticate, async (req, res) => {
    const { participantIds, isGroup, name } = req.body;
    const currentUserId = req.user._id.toString(); // Ensure it's a string

    try {
        if (isGroup) {
            if (!name) {
                return res.status(400).json({ message: 'Group name is required for group chats.' });
            }

            if (!participantIds || participantIds.length < 2) {
                return res.status(400).json({ message: 'At least two participants are required for a group chat.' });
            }

            // Include the current user if not already included
            if (!participantIds.includes(currentUserId)) {
                participantIds.push(currentUserId);
            }

            // Convert participantIds to ObjectId
            const participantObjectIds = participantIds.map((id) => mongoose.Types.ObjectId(id));

            // Create new group conversation
            const newConversation = new Conversation({
                isGroup: true,
                name,
                participants: participantObjectIds,
                groupAdmin: currentUserId,
            });

            const savedConversation = await newConversation.save();
            res.status(201).json({ conversation: savedConversation });
        } else {
            // One-on-one conversation
            if (!participantIds || participantIds.length !== 1) {
                return res.status(400).json({ message: 'Participant ID is required for one-on-one conversation.' });
            }

            const participantId = participantIds[0];

            // Check if conversation already exists
            const existingConversation = await Conversation.findOne({
                isGroup: false,
                participants: { $size: 2, $all: [currentUserId, participantId] },
            });

            if (existingConversation) {
                return res.status(200).json({ conversation: existingConversation });
            }

            // Create new conversation
            const newConversation = new Conversation({
                participants: [currentUserId, participantId],
            });

            const savedConversation = await newConversation.save();
            res.status(201).json({ conversation: savedConversation });
        }
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ message: 'Server error while creating conversation.' });
    }
});

// GET /conversations
router.get('/', authenticate, async (req, res) => {
    const currentUserId = req.user._id;

    try {
        const conversations = await Conversation.find({
            participants: currentUserId,
        })
            .populate('participants', 'username image')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error while fetching conversations.' });
    }
});

// POST /conversations/:conversationId/addParticipants
router.post('/:conversationId/addParticipants', authenticate, async (req, res) => {
    const { conversationId } = req.params;
    const { participantIds } = req.body;
    const currentUserId = req.user._id.toString();

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        if (!conversation.isGroup) {
            return res.status(400).json({ message: 'Cannot add participants to a one-on-one conversation.' });
        }

        if (conversation.groupAdmin.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Only the group admin can add participants.' });
        }

        // Convert participantIds to ObjectId
        const newParticipantIds = participantIds.map((id) => mongoose.Types.ObjectId(id));

        // Add new participants
        conversation.participants.push(...newParticipantIds);
        await conversation.save();

        res.status(200).json({ conversation });
    } catch (error) {
        console.error('Error adding participants:', error);
        res.status(500).json({ message: 'Server error while adding participants.' });
    }
});

// POST /conversations/:conversationId/removeParticipant
router.post('/:conversationId/removeParticipant', authenticate, async (req, res) => {
    const { conversationId } = req.params;
    const { participantId } = req.body;
    const currentUserId = req.user._id.toString();

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        if (!conversation.isGroup) {
            return res.status(400).json({ message: 'Cannot remove participants from a one-on-one conversation.' });
        }

        if (
            conversation.groupAdmin.toString() !== currentUserId &&
            participantId !== currentUserId
        ) {
            return res.status(403).json({ message: 'Only the group admin or the participant themselves can remove participants.' });
        }

        // Remove participant
        conversation.participants = conversation.participants.filter(
            (id) => id.toString() !== participantId
        );

        // If the group is empty, delete it
        if (conversation.participants.length === 0) {
            await Conversation.findByIdAndDelete(conversationId);
            return res.status(200).json({ message: 'Conversation deleted as it has no participants.' });
        }

        await conversation.save();

        res.status(200).json({ conversation });
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ message: 'Server error while removing participant.' });
    }
});

router.post('/:conversationId/rename', authenticate, async (req, res) => {
    const { conversationId } = req.params;
    const { name } = req.body;
    const currentUserId = req.user._id;

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation || !conversation.isGroup) {
            return res.status(404).json({ message: 'Group chat not found.' });
        }

        if (!conversation.groupAdmin.equals(currentUserId)) {
            return res.status(403).json({ message: 'Only the group admin can rename the group chat.' });
        }

        conversation.name = name;
        await conversation.save();

        res.status(200).json({ conversation });
    } catch (error) {
        console.error('Error renaming group chat:', error);
        res.status(500).json({ message: 'Server error while renaming group chat.' });
    }
});


module.exports = router;
