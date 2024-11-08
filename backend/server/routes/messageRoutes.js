const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const Message = require('../models/messageModel');
const checkFriendship = require('../utilities/checkFriendship');

router.get('/conversations/:userId', authenticate, async (req, res) => {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Check friendship
    const isFriend = await checkFriendship(currentUserId, otherUserId);
    if (!isFriend) {
        return res.status(403).json({ message: 'You are not friends with this user.' });
    }

    // Fetch messages
    const messages = await Message.find({
        $or: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId },
        ],
    }).sort({ timestamp: 1 }); // Sort by timestamp ascending

    res.json(messages);
});

module.exports = router;
