const express = require("express");
const router = express.Router();
const Event = require("../models/eventModel");
const authenticate = require("../middleware/auth");
const User = require('../models/userModel');
const Park = require('../models/parkModel');
const Notification = require('../models/notificationModel');

// POST route to create a new event
router.post("/create", authenticate, async (req, res) => {
    try {
        const { parkId, dogs, time, date, duration } = req.body;
        const userId = req.user._id;

        // Validate the input
        if (!parkId || !dogs || !dogs.length || !time || !date) {
            return res.status(400).json({ message: "All fields are required, including at least one dog." });
        }

        // Verify that the dogs belong to the user
        const user = await User.findById(userId).select('dogId friends');
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const userDogIds = user.dogId.map((_id) => _id.toString());
        const invalidDogs = dogs.filter((dogId) => !userDogIds.includes(dogId));

        if (invalidDogs.length > 0) {
            return res.status(400).json({ message: "You can only add your own dogs to the event." });
        }

        // Parse the date and time into a Date object
        const eventStartTime = new Date(`${date}T${time}:00`);
        if (isNaN(eventStartTime)) {
            return res.status(400).json({ message: "Invalid date or time format." });
        }

        // Calculate the duration (default to 60 minutes if not provided)
        const eventDuration = duration || 60;

        // Calculate the expiration time
        const expiresAt = new Date(eventStartTime.getTime() + eventDuration * 60000);

        // Create a new event instance
        const newEvent = new Event({
            userId,
            parkId,
            dogs,
            time,
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

        // After creating the event, fetch the user's friends
        const userFriends = user.friends;

        if (userFriends && userFriends.length > 0) {
            // Create a notification for each friend
            const notifications = userFriends.map(friend => ({
                type: 'event_created',
                sender: userId,
                receiver: friend._id,
                event: savedEvent._id,
            }));

            // Save notifications and update friends' notification lists
            const savedNotifications = await Notification.insertMany(notifications);

            // Update each friend's notifications
            const friendIds = userFriends.map(friend => friend._id);
            await User.updateMany(
                { _id: { $in: friendIds } },
                { $push: { notifications: { $each: savedNotifications.map(n => n._id) } } }
            );
        }

        // Respond with the saved event
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not create the event." });
    }
});

// GET route to fetch all events
router.get("/all", async (req, res) => {
    try {
        const events = await Event.find().populate('userId').populate('parkId').populate('dogs');
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not retrieve events." });
    }
});

// Route to get events for the authenticated user
router.get('/user', authenticate, async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user._id }).populate('parkId');
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events.' });
    }
});

// GET route to fetch a specific event by ID
router.get("/:_id", async (req, res) => {
    try {
        const eventId = req.params._id;

        // Find the event by ID and populate the referenced user and park
        const event = await Event.findById(eventId).populate('userId').populate('parkId').populate('dogs');

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not retrieve event." });
    }
});

// GET route to fetch all events for a single user
router.get('/user/:_id', authenticate, async (req, res) => {
    const { _id: userId } = req.params;

    try {
        // Find all events that match the provided userId
        const events = await Event.find({ userId }).populate('parkId');

        // If no events are found, return a 404 response
        if (!events.length) {
            return res.status(404).json({ message: 'No events found for this user.' });
        }

        // Respond with the events found
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events for user:', error);
        res.status(500).json({ message: 'Server error. Could not retrieve events.' });
    }
});

// PUT route to update an event by ID
router.put("/update/:_id", async (req, res) => {
    try {
        const eventId = req.params._id;
        const { userId, parkId, time, date } = req.body;

        // Validate if all necessary fields are provided
        if (!userId || !parkId || !time || !date) {
            return res.status(400).json({ message: "All fields (userId, parkId, time, date) are required for updating the event." });
        }

        // Find the event by ID and update it
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { userId, parkId, time, date },
            { new: true, runValidators: true }
        ).populate('userId').populate('parkId');

        // Check if the event was found and updated
        if (!updatedEvent) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Respond with the updated event
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not update event." });
    }
});

// DELETE route to delete an event by ID
router.delete("/delete/:_id", async (req, res) => {
    try {
        const eventId = req.params._id;

        // Find the event by ID and delete it
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        // If the event doesn't exist, return a 404 error
        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Remove the event ID from user and park documents
        await User.findByIdAndUpdate(deletedEvent.userId, {
            $pull: { eventId: deletedEvent._id }
        });

        await Park.findByIdAndUpdate(deletedEvent.parkId, {
            $pull: { eventId: deletedEvent._id }
        });

        // Respond with a success message
        res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not delete the event." });
    }
});

module.exports = router;