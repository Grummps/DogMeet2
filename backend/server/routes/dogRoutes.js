const express = require('express');
const router = express.Router();
const dogModel = require('../models/dogModel');
const mongoose = require('mongoose')
const newUserModel = require('../models/userModel')
const multer = require('multer');
const storage = multer.memoryStorage();  // If you're handling image uploads with memoryStorage
const upload = multer({ storage });

// Create a new dog and assign it to the user
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { dogName, size, userId } = req.body;

        // Validate required fields
        if (!dogName || !size || !userId) {
            return res.status(400).json({ message: 'Dog name, size, and user ID are required.' });
        }

        // Validate size
        const validSizes = ['small', 'medium', 'large'];
        if (!validSizes.includes(size)) {
            return res.status(400).json({ message: 'Invalid size. Must be small, medium, or large.' });
        }

        // Create a new dog document
        const newDog = new dogModel({
            dogName,
            size,
            image: req.file ? req.file.path : null  // Handle image if it's uploaded
        });

        const savedDog = await newDog.save();

        // Update the user's profile with the new dogId
        await newUserModel.findByIdAndUpdate(userId, { $push: { dogId: savedDog._id } });


        res.status(201).json({ message: 'Dog created and assigned to user successfully.', dog: savedDog });
    } catch (error) {
        console.error('Error creating dog:', error);
        res.status(500).json({ message: 'Error creating dog.' });
    }
});


// Get a specific dog by ID
router.get('/:id', async (req, res) => {
    try {
        const dogId = req.params.id;

        // Validate ObjectId
        if (!dogId || !mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog ID.' });
        }

        const dog = await dogModel.findById(dogId);
        if (!dog) {
            return res.status(404).json({ message: 'Dog not found.' });
        }

        res.status(200).json(dog);
    } catch (error) {
        console.error('Error fetching dog:', error);
        res.status(500).json({ message: 'Error fetching dog.' });
    }
});

// Update a dog by ID
router.put('/update/:id', async (req, res) => {
    try {
        const dogId = req.params.id;
        const { dogName, size, image } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog ID.' });
        }

        // Find and update the dog
        const updatedDog = await dogModel.findByIdAndUpdate(
            dogId,
            { dogName, size, image },
            { new: true, runValidators: true }
        );

        if (!updatedDog) {
            return res.status(404).json({ message: 'Dog not found.' });
        }

        res.status(200).json(updatedDog);
    } catch (error) {
        console.error('Error updating dog:', error);
        res.status(500).json({ message: 'Error updating dog.' });
    }
});

// Delete a dog by ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const dogId = req.params.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog ID.' });
        }

        const deletedDog = await dogModel.findByIdAndDelete(dogId);
        if (!deletedDog) {
            return res.status(404).json({ message: 'Dog not found.' });
        }

        res.status(200).json({ message: 'Dog deleted successfully.' });
    } catch (error) {
        console.error('Error deleting dog:', error);
        res.status(500).json({ message: 'Error deleting dog.' });
    }
});

module.exports = router;
