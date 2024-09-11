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
    // Use partial validation for updating user details
    const { error } = partialUserValidation(req.body);

    // Log the full validation error if it exists
    if (error) {
        console.log("Validation error:", error);  // Log the full error to the console
        return res.status(400).send({ message: error.errors[0].message });
    }

    const id = req.params.id;  // Get user ID from the URL parameter
    const { username, email, password, parkId, dogId, friends, eventId } = req.body;

    // Check if the username is being updated, and validate its availability
    if (username) {
        const user = await newUserModel.findOne({ username });
        if (user && user._id.toString() !== id) {
            return res.status(409).send({ message: "Username is taken, pick another" });
        }
    }

    // If password is provided, hash it before updating
    let hashPassword;
    if (password) {
        const generateHash = await bcrypt.genSalt(Number(10));
        hashPassword = await bcrypt.hash(password, generateHash);
    }

    // Create the update object dynamically based on provided fields
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (password) updateFields.password = hashPassword;  // Use the hashed password if provided
    if (parkId) updateFields.parkId = parkId;
    if (dogId) updateFields.dogId = dogId;
    if (friends) updateFields.friends = friends.map(friendId => mongoose.Types.ObjectId(friendId));
    if (eventId) updateFields.eventId = eventId;

    // Update the user with only the provided fields
    newUserModel.findByIdAndUpdate(
        id,
        { $set: updateFields },  // Only update the fields that were passed in
        { new: true, runValidators: true },
        (err, updatedUser) => {
            if (err) {
                console.log("Error updating user:", err);  // Log error if update fails
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
                select: 'dogName image',  // Fetch only the dog's name and image
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

module.exports = router;
