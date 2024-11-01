const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const User = require('../models/userModel');
const { newUserValidation, partialUserValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');
const authenticate = require("../middleware/auth");
const Notification = require("../models/notificationModel");

// Route to delete all users
router.post('/deleteAll', async (req, res) => {
    const user = await User.deleteMany();
    return res.json(user);
});

// Route to get all users
router.get('/getAll', async (req, res) => {
    try {
        const users = await User.find({})
            .populate('parkId')
            .populate('dogId')
            .populate('friends')
            .populate('eventId');

        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send({ message: 'Error fetching users.' });
    }
});

// Route to get incoming friend requests
router.get('/friend-requests', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friendRequests', '_id username')
            .exec();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ friendRequests: user.friendRequests });
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get list of friends
router.get('/friends', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', '_id username')
            .exec();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ friends: user.friends });
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to search for users
router.get('/search', authenticate, async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ],
            _id: { $ne: req.user._id }, // Exclude the current user
        }).select('username email');

        res.json({ users });
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /users/notifications
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', 'username')
            .populate({
                path: 'event',
                populate: {
                    path: 'parkId',
                    select: 'parkName', // Only retrieve parkName to limit data transfer
                },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

// ============== Dynamic routes ==============

// ============== Notif routes ==============

// DELETE /users/notifications/:id
router.delete('/notifications/:_id', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params._id;

        // Find the notification to ensure it belongs to the authenticated user
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        if (notification.receiver.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to delete this notification.' });
        }

        // Delete the notification
        await Notification.findByIdAndDelete(notificationId);

        // Remove the notification from the user's notifications array
        await User.findByIdAndUpdate(userId, { $pull: { notifications: notificationId } });


        res.json({ message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Failed to delete notification.' });
    }
});

// Route to mark a notification as read
router.post('/notifications/:_id/read', authenticate, async (req, res) => {
    try {
        const notificationId = req.params._id;
        const userId = req.user._id;

        // Validate notificationId
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found.' });
        }

        // Ensure the notification belongs to the user
        if (notification.receiver.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        notification.read = true;
        await notification.save();

        res.json({ message: 'Notification marked as read.' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
});

module.exports = router;


// ============== Other routes ==============

// Route to get a user by ID
router.get("/:_id", async (req, res) => {
    console.log("_ID:", req.params._id);
    const userId = req.params._id;

    try {
        const user = await User.findById(userId)
            .populate({
                path: 'dogId',
                select: 'dogName image size',
            })
            .populate('parkId')
            .populate('friends', '_id username')
            .populate('friendRequests', '_id username')
            .populate('eventId');

        if (!user) {
            return res.status(404).send("User ID does not exist.");
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send({ message: 'Error fetching user.' });
    }
});

// Route to remove a friend
router.post('/:_id/remove-friend', authenticate, async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params._id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    if (userId.toString() === friendId) {
        return res.status(400).json({ error: 'Cannot remove yourself as a friend' });
    }

    try {
        const [user, friend] = await Promise.all([
            User.findById(userId),
            User.findById(friendId),
        ]);

        if (!user || !friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if they are friends
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ error: 'You are not friends with this user' });
        }

        // Remove friendId from user's friends array
        user.friends = user.friends.filter(_id => _id.toString() !== friendId);
        // Remove userId from friend's friend array
        friend.friends = friend.friends.filter(_id => _id.toString() !== userId);

        await Promise.all([user.save(), friend.save()]);
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to remove a dog from the user's dogId array
router.delete('/removeDog/:_id/:dogId', async (req, res) => {
    const { _id, dogId } = req.params;

    try {
        // Ensure dogId is a valid ObjectId
        const dogObjectId = mongoose.Types.ObjectId(dogId);

        // Update the user's dogId array by pulling the specified dogId
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { $pull: { dogId: dogObjectId } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found." });
        }

        res.status(200).json({ message: "Dog removed successfully.", user: updatedUser });
    } catch (error) {
        console.error('Error removing dog:', error);
        res.status(500).json({ message: 'Error removing dog.' });
    }
});

// Route to edit a user using the :id parameter in the URL
router.put('/editUser/:_id', authenticate, async (req, res) => {
    const { error } = partialUserValidation(req.body);

    if (error) {
        console.log("Validation error:", error);
        return res.status(400).send({ message: error.errors[0].message });
    }

    const _id = req.params._id;
    const { username, email, password, parkId, dogId, friends, eventId } = req.body;

    if (username) {
        const user = await User.findOne({ username });
        if (user && user._id.toString() !== _id) {
            return res.status(409).send({ message: "Username is taken, pick another" });
        }
    }

    let hashPassword;
    if (password) {
        const generateHash = await bcrypt.genSalt(Number(10));
        hashPassword = await bcrypt.hash(password, generateHash);
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (password) updateFields.password = hashPassword;
    if (parkId) updateFields.parkId = parkId;
    if (eventId) updateFields.eventId = eventId;

    // Update dogId array
    if (Array.isArray(dogId)) {
        const dogIds = dogId.map(dog => mongoose.Types.ObjectId(dog));
        updateFields.dogId = { $addToSet: { $each: dogIds } }; // Add multiple dog IDs
    }

    // Update friends array
    if (Array.isArray(friends)) {
        const friendIds = friends.map(friend => mongoose.Types.ObjectId(friend));
        updateFields.friends = { $addToSet: { $each: friendIds } }; // Add multiple friend IDs
    }

    User.findByIdAndUpdate(
        _id,
        { $set: updateFields },
        { new: true, runValidators: true },
        (err, updatedUser) => {
            if (err) {
                console.log("Error updating user:", err);
                return res.status(500).send({ message: 'Error updating user.' });
            } else {
                const accessToken = generateAccessToken(updatedUser._id, updatedUser.email, updatedUser.username, updatedUser.password);
                res.header('Authorization', accessToken).send({ accessToken });
            }
        }
    );
});

// Route to send a friend request
router.post('/:_id/send-friend-request', authenticate, async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params._id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    if (userId.toString() === friendId) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    try {
        const [user, friend] = await Promise.all([
            User.findById(userId),
            User.findById(friendId),
        ]);

        if (!friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if users are already friends
        if (user.friends.includes(friendId)) {
            return res.status(400).json({ error: 'Already friends with this user' });
        }

        // Check if a friend request has already been sent from current user to friend
        if (friend.friendRequests.includes(userId)) {
            return res.status(400).json({ error: 'Friend request already sent' });
        }

        // **New Check**: See if the friend has already sent a friend request to the current user
        if (user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: 'User has already sent you a friend request' });
        }

        // Add userId to friend's friendRequests array
        friend.friendRequests.push(userId);
        await friend.save();

        // Create a notification
        const notification = new Notification({
            type: 'friend_request',
            sender: userId,
            receiver: friendId,
        });

        await notification.save();

        // Add the notification to the recipient's notifications array
        friend.notifications.push(notification._id);
        await friend.save();

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to accept a friend request
router.post('/:_id/accept-friend-request', authenticate, async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params._id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const [user, friend] = await Promise.all([
            User.findById(userId),
            User.findById(friendId),
        ]);

        if (!user || !friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if there's a friend request from friendId to userId
        if (!user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: 'No friend request from this user' });
        }

        // Add friendId to user's friends array if not already present
        if (!user.friends.includes(friendId)) {
            user.friends.push(friendId);
        }

        // Add userId to friend's friends array if not already present
        if (!friend.friends.includes(userId)) {
            friend.friends.push(userId);
        }

        // Remove friendId from user's friendRequests array
        user.friendRequests = user.friendRequests.filter(_id => _id.toString() !== friendId);

        await Promise.all([user.save(), friend.save()]);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to decline a friend request
router.post('/:_id/decline-friend-request', authenticate, async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params._id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(userId);

        if (!user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: 'No friend request from this user' });
        }

        // Remove friendId from user's friendRequests array
        user.friendRequests = user.friendRequests.filter(_id => _id.toString() !== friendId);

        await user.save();

        res.json({ message: 'Friend request declined' });
    } catch (error) {
        console.error("Error declining friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to cancel a friend request
router.post('/:_id/cancel-friend-request', authenticate, async (req, res) => {
    const userId = req.user._id;
    const recipientId = req.params._id;

    // Validate recipientId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const [user, recipient] = await Promise.all([
            User.findById(userId),
            User.findById(recipientId),
        ]);

        if (!user || !recipient) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the friend request exists
        if (!recipient.friendRequests.includes(userId)) {
            return res.status(400).json({ error: 'Friend request does not exist' });
        }

        // Remove userId from recipient's friendRequests array
        recipient.friendRequests = recipient.friendRequests.filter(_id => _id.toString() !== userId);

        await recipient.save();

        res.json({ message: 'Friend request cancelled' });
    } catch (error) {
        console.error("Error cancelling friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
