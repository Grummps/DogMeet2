const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const newUserModel = require('../models/userModel');
const { newUserValidation, partialUserValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');
const authenticate = require("../middleware/auth");

// Route to delete all users
router.post('/deleteAll', async (req, res) => {
    const user = await newUserModel.deleteMany();
    return res.json(user);
});

// Route to get all users
router.get('/getAll', async (req, res) => {
    try {
        const users = await newUserModel.find({})
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
        const user = await newUserModel.findById(req.user.id)
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
        const user = await newUserModel.findById(req.user.id)
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
        const users = await newUserModel.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ],
            _id: { $ne: req.user.id }, // Exclude the current user
        }).select('username email');

        res.json({ users });
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============== Dynamic routes ==============

// Route to get a user by ID
router.get("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await newUserModel.findById(userId)
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
router.post('/:id/remove-friend', authenticate, async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.id;

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
            newUserModel.findById(userId),
            newUserModel.findById(friendId),
        ]);

        if (!user || !friend) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if they are friends
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ error: 'You are not friends with this user' });
        }

        // Remove friendId from user's friends array
        user.friends = user.friends.filter(id => id.toString() !== friendId);
        // Remove userId from friend's friend array
        friend.friends = friend.friends.filter(id => id.toString() !== userId);

        await Promise.all([user.save(), friend.save()]);
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to remove a dog from the user's dogId array
router.delete('/removeDog/:id/:dogId', async (req, res) => {
    const { id, dogId } = req.params;

    try {
        // Ensure dogId is a valid ObjectId
        const dogObjectId = mongoose.Types.ObjectId(dogId);

        // Update the user's dogId array by pulling the specified dogId
        const updatedUser = await newUserModel.findByIdAndUpdate(
            id,
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
router.put('/editUser/:id', authenticate, async (req, res) => {
    const { error } = partialUserValidation(req.body);

    if (error) {
        console.log("Validation error:", error);
        return res.status(400).send({ message: error.errors[0].message });
    }

    const id = req.params.id;
    const { username, email, password, parkId, dogId, friends, eventId } = req.body;

    if (username) {
        const user = await newUserModel.findOne({ username });
        if (user && user._id.toString() !== id) {
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

    newUserModel.findByIdAndUpdate(
        id,
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
router.post('/:id/send-friend-request', authenticate, async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.id;

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
            newUserModel.findById(userId),
            newUserModel.findById(friendId),
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

        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to accept a friend request
router.post('/:id/accept-friend-request', authenticate, async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const [user, friend] = await Promise.all([
            newUserModel.findById(userId),
            newUserModel.findById(friendId),
        ]);

        if (!user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: 'No friend request from this user' });
        }

        // Add friendId to user's friends array
        user.friends.push(friendId);

        // Add userId to friend's friends array
        friend.friends.push(userId);

        // Remove friendId from user's friendRequests array
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);

        await Promise.all([user.save(), friend.save()]);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to decline a friend request
router.post('/:id/decline-friend-request', authenticate, async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.id;

    // Validate that friendId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await newUserModel.findById(userId);

        if (!user.friendRequests.includes(friendId)) {
            return res.status(400).json({ error: 'No friend request from this user' });
        }

        // Remove friendId from user's friendRequests array
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);

        await user.save();

        res.json({ message: 'Friend request declined' });
    } catch (error) {
        console.error("Error declining friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to cancel a friend request
router.post('/:id/cancel-friend-request', authenticate, async (req, res) => {
    const userId = req.user.id;
    const recipientId = req.params.id;

    // Validate recipientId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const [user, recipient] = await Promise.all([
            newUserModel.findById(userId),
            newUserModel.findById(recipientId),
        ]);

        if (!user || !recipient) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the friend request exists
        if (!recipient.friendRequests.includes(userId)) {
            return res.status(400).json({ error: 'Friend request does not exist' });
        }

        // Remove userId from recipient's friendRequests array
        recipient.friendRequests = recipient.friendRequests.filter(id => id.toString() !== userId);

        await recipient.save();

        res.json({ message: 'Friend request cancelled' });
    } catch (error) {
        console.error("Error cancelling friend request:", error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
