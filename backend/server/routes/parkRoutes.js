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
      // eventId is handled automatically or later
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
    const parks = await Park.find().populate('eventId');
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
    const { parkName, eventId, image } = req.body;

    // Update fields if they are provided in the request
    if (parkName !== undefined) req.park.parkName = parkName;
    if (eventId !== undefined) {
      req.park.eventId = eventId.map(id => mongoose.Types.ObjectId(id));
    }
    if (image !== undefined) req.park.image = image;

    const updatedPark = await req.park.save().populate('eventId');

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

// Get active (checked-in) events for a specific park
router.get('/:id/events/active', async (req, res) => {
  try {
    const parkId = req.params.id;
    const now = new Date();

    // Find events that have started but not yet expired
    const activeEvents = await Event.find({
      parkId,
      date: { $lte: now },
      expiresAt: { $gt: now },
    })
      .populate({
        path: 'dogs',
        select: 'dogName size ownerId image',
        populate: {
          path: 'ownerId',
          select: 'username',
        },
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json(activeEvents);
  } catch (error) {
    console.error('Error fetching active events:', error);
    res.status(500).json({ message: 'Error fetching active events.' });
  }
});

// POST /parks/:id/check-in
router.post('/:id/check-in', authenticate, async (req, res) => {
  try {
    const parkId = req.params.id;
    const { dogIds, duration } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!dogIds || !dogIds.length) {
      return res.status(400).json({ message: 'Please select at least one dog.' });
    }

    // Verify that the dogs belong to the user
    const userDogs = await User.findById(userId).select('dogId');
    const userDogIds = userDogs.dogId.map((id) => id.toString());

    const invalidDogs = dogIds.filter((dogId) => !userDogIds.includes(dogId));

    if (invalidDogs.length > 0) {
      return res.status(400).json({ message: 'You can only check in your own dogs.' });
    }

    // Use the current time as the start time
    const eventStartTime = new Date();

    // Calculate the duration (default to 60 minutes if not provided)
    const eventDuration = duration || 60;

    // Calculate the expiration time
    const expiresAt = new Date(eventStartTime.getTime() + eventDuration * 60000);

    // Create a new event instance
    const newEvent = new Event({
      userId,
      parkId,
      dogs: dogIds,
      time: eventStartTime.toTimeString().substr(0, 5),
      date: eventStartTime,
      duration: eventDuration,
      expiresAt,
    });

    // Save the new event to the database
    const savedEvent = await newEvent.save();

    // Update user and park documents
    await User.findByIdAndUpdate(userId, {
      $addToSet: { eventId: savedEvent._id },
    });

    await Park.findByIdAndUpdate(parkId, {
      $addToSet: { eventId: savedEvent._id },
    });

    res.status(200).json({ message: 'Checked in successfully.', event: savedEvent });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: 'Error during check-in.' });
  }
});

module.exports = router;
