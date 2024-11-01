const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const dogModel = require('../models/dogModel');
const newUserModel = require('../models/userModel');
const upload = require('../config/multerConfig');  // Import the Multer configuration
const s3 = require('../config/s3Config');  // Import the S3 configuration
const { v4: uuidv4 } = require('uuid');  // For generating unique file names
const { URL } = require('url');
const authenticate = require('../middleware/auth');

// Create a new dog and assign it to the user
router.post('/create', authenticate, upload.single('image'), async (req, res) => {
    try {
        const { dogName, size } = req.body;
        const userId = req.user._id; // Get _id from authenticated user

        // Validate required fields
        if (!dogName || !size) {
            return res.status(400).json({ message: 'Dog name and size are required.' });
        }

        // Validate size
        const validSizes = ['small', 'medium', 'large'];
        if (!validSizes.includes(size)) {
            return res.status(400).json({ message: 'Invalid size. Must be small, medium, or large.' });
        }

        // Prepare for S3 upload if an image is provided
        let imageUrl = null;
        if (req.file) {
            const fileContent = req.file.buffer;
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;

            // Define S3 upload parameters
            const params = {
                Bucket: 'dogmeet', // Replace with your actual bucket name
                Key: `dogs/${fileName}`,
                Body: fileContent,
                ContentType: req.file.mimetype,
            };

            // Upload the file to S3
            const s3Response = await s3.upload(params).promise();
            imageUrl = s3Response.Location; // Get the public URL of the uploaded file
        }

        // Create a new dog document with ownerId
        const newDog = new dogModel({
            dogName,
            size,
            image: imageUrl,
            ownerId: userId, // Set the ownerId to the authenticated user's _id
        });

        const savedDog = await newDog.save();

        // Update the user's profile with the new dog _id
        await newUserModel.findByIdAndUpdate(userId, { $push: { dogId: savedDog._id } });

        res.status(201).json({ message: 'Dog created and assigned to user successfully.', dog: savedDog });
    } catch (error) {
        console.error('Error creating dog:', error);
        res.status(500).json({ message: 'Error creating dog.' });
    }
});

// Get a specific dog by _id
router.get('/:_id', async (req, res) => {
    try {
        const dogId = req.params._id;

        // Validate ObjectId
        if (!dogId || !mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog _id.' });
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

// Update a dog by _id
router.put('/update/:_id', async (req, res) => {
    try {
        const dogId = req.params._id;
        const { dogName, size, image } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog _id.' });
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

// Delete a dog by _id
router.delete('/delete/:_id', async (req, res) => {
    try {
        const dogId = req.params._id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(dogId)) {
            return res.status(400).json({ message: 'Invalid dog _id.' });
        }

        // Find the dog first to get the image URL
        const dog = await dogModel.findById(dogId);
        if (!dog) {
            return res.status(404).json({ message: 'Dog not found.' });
        }

        // If there is an image, delete it from S3
        if (dog.image) {
            try {
                const imageUrl = dog.image;
                const url = new URL(imageUrl);
                const key = decodeURIComponent(url.pathname.substring(1));  // Remove leading '/'

                // Define S3 delete parameters
                const params = {
                    Bucket: 'dogmeet',  // Replace with your actual bucket name
                    Key: key
                };

                // Delete the object from S3
                await s3.deleteObject(params).promise();
            } catch (s3Error) {
                console.error('Error deleting image from S3:', s3Error);
            }
        }

        // Now delete the dog from the database
        await dogModel.findByIdAndDelete(dogId);

        res.status(200).json({ message: 'Dog and associated image deleted successfully.' });
    } catch (error) {
        console.error('Error deleting dog:', error);
        res.status(500).json({ message: 'Error deleting dog.' });
    }
});

module.exports = router;
