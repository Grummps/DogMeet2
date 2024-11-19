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

// GET /parks/nearby
router.get('/nearby', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }

  try {
    const userLocation = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)], // [longitude, latitude]
    };

    const nearbyParks = await Park.aggregate([
      {
        $geoNear: {
          near: userLocation,
          distanceField: 'distance',
          spherical: true,
          maxDistance: 5000, // Adjust as needed
        },
      },
    ]);


    res.status(200).json(nearbyParks);
  } catch (error) {
    console.error('Error fetching nearby parks:', error);
    res.status(500).json({ message: 'Error fetching nearby parks.' });
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

    // Step 1: Delete events that have no associated dogs
    Event.deleteMany({
      parkId: parkId,
      date: { $gte: now },
      dogs: { $size: 0 }, // Assumes 'dogs' is an array field in the Event model
    });

    // Step 2: Fetch the remaining upcoming events
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

    // Validate parkId
    if (!mongoose.Types.ObjectId.isValid(parkId)) {
      return res.status(400).json({ message: 'Invalid park ID.' });
    }

    const now = new Date();

    // Delete Active Events with No Dogs
    await Event.deleteMany({
      parkId: parkId,
      date: { $lte: now },
      expiresAt: { $gt: now },
      dogs: { $size: 0 },
    });


    // **Fetch Active Events**
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

    // **New Validation: Prevent Overlapping Check-Ins**
    // This ensures that the new check-in does not overlap with any existing active events for the user.

    const overlappingEvent = await Event.findOne({
      userId: userId,
      expiresAt: { $gt: eventStartTime }, // Events that end after the new event starts
      $or: [
        { date: { $lte: eventStartTime }, expiresAt: { $gt: eventStartTime } }, // Overlaps start
        { date: { $lt: expiresAt }, expiresAt: { $gte: expiresAt } },         // Overlaps end
        { date: { $gte: eventStartTime }, expiresAt: { $lte: expiresAt } },   // Completely within
      ],
    });

    if (overlappingEvent) {
      return res.status(400).json({ message: 'The check-in time overlaps with an existing event.' });
    }

    // Create a new event instance
    const newEvent = new Event({
      userId,
      parkId,
      dogs: dogIds,
      time: eventStartTime.toTimeString().substr(0, 5), // Extract HH:mm format
      date: eventStartTime,
      duration: eventDuration,
      expiresAt,
    });

    // Save the new event to the database
    const savedEvent = await newEvent.save();

    // Update user and park documents
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { eventId: savedEvent._id },
      }),
      Park.findByIdAndUpdate(parkId, {
        $addToSet: { eventId: savedEvent._id },
      }),
    ]);

    // **Optional: Send Notifications to Friends**
    // If you have a notification system similar to the create event route, you can integrate it here as well.

    res.status(200).json({ message: 'Checked in successfully.', event: savedEvent });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: 'Server error. Could not complete check-in.' });
  }
});

// POST /parks/:_id/check-out
router.post('/:_id/check-out', authenticate, async (req, res) => {
  try {
    const parkId = req.params._id;
    const userId = req.user._id;
    const now = new Date(); // Current time

    // Find the user's active event at this park
    const activeEvent = await Event.findOne({
      userId,
      parkId,
      date: { $lte: now },
      expiresAt: { $gt: now },
    });

    if (!activeEvent) {
      return res.status(400).json({ message: 'You are not currently checked in at this park.' });
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
    res.status(500).json({ message: 'An unexpected error occurred during check-out. Please try again later.' });
  }
});



module.exports = router;
