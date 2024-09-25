const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const dogModel = require('../models/dogModel');
const newUserModel = require('../models/userModel');
const upload = require('../config/multerConfig');  // Import the Multer configuration
const s3 = require('../config/s3Config');  // Import the S3 configuration
const { v4: uuidv4 } = require('uuid');  // For generating unique file names

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

        // Prepare for S3 upload if an image is provided
        let imageUrl = null;
        if (req.file) {
            const fileContent = req.file.buffer;  // Get the file content from memory (Multer memoryStorage)
            const fileExt = req.file.originalname.split('.').pop();  // Extract file extension
            const fileName = `${uuidv4()}.${fileExt}`;  // Generate a unique file name

            // Define S3 upload parameters
            const params = {
                Bucket: 'dogmeet',  // Replace with your actual bucket name
                Key: `dogs/${fileName}`,     // Save the file in a 'dogs/' folder in S3
                Body: fileContent,
                ContentType: req.file.mimetype,  // Set the correct MIME type
            };

            // Upload the file to S3
            const s3Response = await s3.upload(params).promise();
            imageUrl = s3Response.Location;  // Get the public URL of the uploaded file
        }

        // Create a new dog document
        const newDog = new dogModel({
            dogName,
            size,
            image: imageUrl  // Save the image URL if it was uploaded
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
