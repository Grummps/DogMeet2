const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const newUserModel = require('../models/userModel');
const { newUserValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');
const { partialUserValidation } = require('../models/userValidator');

// Route to delete all users
router.post('/deleteAll', async (req, res) => {
    const user = await newUserModel.deleteMany();
    return res.json(user);
});


// Route to edit a user using the :id parameter in the URL
router.put('/editUser/:id', async (req, res) => {
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
        const friendIds = friends.map(friend => mongoose.Types.ObjectId(friend)); // Convert to ObjectId
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
        console.error("Error fetching users:", error);  // Log the full error for debugging
        res.status(500).send({ message: 'Error fetching users.' });
    }
});


// Route to get a user by ID
router.get("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await newUserModel.findById(userId)
            .populate({
                path: 'dogId',  // Populate the dog details
                select: 'dogName image size',  // Fetch only the dog's name and image
            })
            .populate('parkId')
            .populate('friends')
            .populate('eventId');

        if (!user) {
            return res.status(404).send("User ID does not exist.");
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);  // Log the full error for debugging
        res.status(500).send({ message: 'Error fetching user.' });
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
            { $pull: { dogId: dogObjectId } },  // Remove the dogId from the array
            { new: true, runValidators: true }  // Return the updated user document
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


module.exports = router;
