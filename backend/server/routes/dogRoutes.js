const express = require('express');
const router = express.Router();
const dogModel = require('../models/dogModel');
const mongoose = require('mongoose')

// Create a new dog
router.post('/create', async (req, res) => {
    try {
        const { dogName, size, image } = req.body;

        // Validate required fields
        if (!dogName || !size) {
            return res.status(400).json({ message: 'Dog name and size are required.' });
        }

        // Create a new dog document
        const newDog = new dogModel({
            dogName,
            size,
            image
        });

        const savedDog = await newDog.save();
        res.status(201).json(savedDog);
    } catch (error) {
        console.error('Error creating dog:', error);
        res.status(500).json({ message: 'Error creating dog.' });
    }
});

// Get all dogs
router.get('/all', async (req, res) => {
    try {
        const dogs = await dogModel.find();
        res.status(200).json(dogs);
    } catch (error) {
        console.error('Error fetching dogs:', error);
        res.status(500).json({ message: 'Error fetching dogs.' });
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
