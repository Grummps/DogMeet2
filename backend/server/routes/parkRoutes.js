const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Park = require('../models/parkModel');
const authenticate = require('../middleware/auth');
const authorizeAdmin = require('../middleware/authAdmin');
const getPark = require('../middleware/getPark');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

// Create a new park (Admin Only)
router.post('/create', authenticate, authorizeAdmin, async (req, res) => {
  const { parkName, location } = req.body;

  if (!parkName || !location || !location.coordinates || location.coordinates.length !== 2) {
    return res.status(400).json({ message: 'Invalid park data.' });
  }

  try {
    const newPark = new Park({
      parkName,
      location,
      // occupants and eventId are handled automatically or later
    });

    await newPark.save();
    res.status(201).json({ message: 'Park created successfully.', park: newPark });
  } catch (error) {
    console.error('Error creating park:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get all parks
router.get('/all', async (req, res) => {
  try {
    const parks = await Park.find().populate('occupants').populate('eventId');
    res.status(200).json(parks);
  } catch (error) {
    console.error('Error fetching parks:', error);
    res.status(500).json({ message: 'Error fetching parks.' });
  }
});

// Get a specific park by ID
router.get('/:id', getPark, (req, res) => {
  res.status(200).json(req.park);
});

// Update a park by ID (Admin Only)
router.put('/update/:id', authenticate, authorizeAdmin, getPark, async (req, res) => {
  try {
    const { parkName, occupants, eventId, image } = req.body;

    // Update fields if they are provided in the request
    if (parkName !== undefined) req.park.parkName = parkName;
    if (occupants !== undefined) {
      req.park.occupants = occupants.map(id => mongoose.Types.ObjectId(id));
    }
    if (eventId !== undefined) {
      req.park.eventId = eventId.map(id => mongoose.Types.ObjectId(id));
    }
    if (image !== undefined) req.park.image = image;

    const updatedPark = await req.park.save().populate('occupants').populate('eventId');

    res.status(200).json(updatedPark);
  } catch (error) {
    console.error('Error updating park:', error);
    res.status(500).json({ message: 'Error updating park.' });
  }
});

// Delete a park by ID (Admin Only)
router.delete('/delete/:id', authenticate, authorizeAdmin, getPark, async (req, res) => {
  try {
    await req.park.remove();
    res.status(200).json({ message: 'Park deleted successfully.' });
  } catch (error) {
    console.error('Error deleting park:', error);
    res.status(500).json({ message: 'Error deleting park.' });
  }
});

// Get upcoming events for a specific park
router.get('/:id/events/upcoming', async (req, res) => {
  try {
    const parkId = req.params.id;
    const now = new Date();

    // Find upcoming events for this park
    const upcomingEvents = await Event.find({
      parkId: parkId,
      date: { $gte: now },
    })
      .populate({
        path: 'dogs',
        select: 'dogName size',
      })
      .sort({ date: 1, time: 1 }); // Optional: sort events by date and time

    res.status(200).json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Error fetching upcoming events.' });
  }
});

// POST /parks/:id/check-in
router.post('/:id/check-in', authenticate, async (req, res) => {
  try {
    const parkId = req.params.id;
    const { dogIds } = req.body; // Array of dog IDs the user wants to check in
    const userId = req.user.id; // From the authenticate middleware

    // Verify that the dogs belong to the user
    const user = await User.findById(userId).select('dogId');
    const userDogIds = user.dogId.map(id => id.toString());
    const invalidDogs = dogIds.filter(dogId => !userDogIds.includes(dogId));

    if (invalidDogs.length > 0) {
      return res.status(400).json({ message: "You can only check in your own dogs." });
    }

    // Update the park's occupants
    await Park.findByIdAndUpdate(parkId, {
      $addToSet: { occupants: { $each: dogIds } },
    });

    res.status(200).json({ message: 'Dogs checked in successfully.' });
  } catch (error) {
    console.error('Error checking in dogs:', error);
    res.status(500).json({ message: 'Error checking in dogs.' });
  }
});

// GET /parks/:id/checked-in-dogs
router.get('/:id/checked-in-dogs', async (req, res) => {
  try {
    const park = await Park.findById(req.params.id).populate({
      path: 'occupants',
      select: 'dogName size ownerId',
      populate: {
        path: 'ownerId',
        select: 'username',
      },
    });

    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    res.status(200).json(park.occupants);
  } catch (error) {
    console.error('Error fetching checked-in dogs:', error);
    res.status(500).json({ message: 'Error fetching checked-in dogs.' });
  }
});



module.exports = router;
