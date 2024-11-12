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

// Get a specific park by _id
router.get('/:_id', getPark, (req, res) => {
  res.status(200).json(req.park);
});

// Update a park by _id (Admin Only)
router.put('/update/:_id', authenticate, authorizeAdmin, getPark, async (req, res) => {
  try {
    const { parkName, eventId, image } = req.body;

    // Update fields if they are provided in the request
    if (parkName !== undefined) req.park.parkName = parkName;
    if (eventId !== undefined) {
      req.park.eventId = eventId.map(_id => mongoose.Types.ObjectId(_id));
    }
    if (image !== undefined) req.park.image = image;

    const updatedPark = await req.park.save().populate('eventId');

    res.status(200).json(updatedPark);
  } catch (error) {
    console.error('Error updating park:', error);
    res.status(500).json({ message: 'Error updating park.' });
  }
});

// Delete a park by _id (Admin Only)
router.delete('/delete/:_id', authenticate, authorizeAdmin, getPark, async (req, res) => {
  try {
    await req.park.remove();
    res.status(200).json({ message: 'Park deleted successfully.' });
  } catch (error) {
    console.error('Error deleting park:', error);
    res.status(500).json({ message: 'Error deleting park.' });
  }
});

// Get upcoming events for a specific park
router.get('/:_id/events/upcoming', async (req, res) => {
  try {
    const parkId = req.params._id;
    const now = new Date();

    // Find upcoming events for this park
    const upcomingEvents = await Event.find({
      parkId: parkId,
      date: { $gte: now },
    })
      .populate({
        path: 'dogs',
        select: 'dogName size image ownerId',
      })
      .sort({ date: 1, time: 1 }); // Optional: sort events by date and time

    res.status(200).json(upcomingEvents);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ message: 'Error fetching upcoming events.' });
  }
});

// Get active (checked-in) events for a specific park
router.get('/:_id/events/active', async (req, res) => {
  try {
    const parkId = req.params._id;
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

// POST /parks/:_id/check-in
router.post('/:_id/check-in', authenticate, async (req, res) => {
  try {
    const parkId = req.params._id;
    const { dogIds, duration } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!dogIds || !dogIds.length) {
      return res.status(400).json({ message: 'Please select at least one dog.' });
    }

    // Verify that the dogs belong to the user
    const userDogs = await User.findById(userId).select('dogId');

    if (!userDogs || !userDogs.dogId) {
      return res.status(400).json({ message: 'No dogs found for this user.' });
    }

    const userDogIds = userDogs.dogId.map((_id) => _id.toString());

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

// POST /parks/:_id/check-out
router.post('/:_id/check-out', authenticate, async (req, res) => {
  try {
    const parkId = req.params._id;
    const userId = req.user._id;

    // Find the user's active event at this park
    const activeEvent = await Event.findOne({ userId, parkId });

    if (!activeEvent) {
      return res.status(400).json({ message: 'You are not checked in at this park.' });
    }

    // Remove the event from the Event collection
    await Event.findByIdAndDelete(activeEvent._id);

    // Remove the eventId from the user's eventId array
    await User.findByIdAndUpdate(userId, {
      $pull: { eventId: activeEvent._id },
    });

    // Remove the eventId from the park's eventId array
    await Park.findByIdAndUpdate(parkId, {
      $pull: { eventId: activeEvent._id },
    });

    res.status(200).json({ message: 'Checked out successfully.' });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({ message: 'Error during check-out.' });
  }
});


module.exports = router;
