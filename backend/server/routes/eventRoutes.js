const express = require("express");
const router = express.Router();
const Event = require("../models/eventModel");

// POST route to create a new event
router.post("/create", async (req, res) => {
    try {
        const { userId, parkId, time, date } = req.body;

        // Validate the input (you can add additional validation logic if needed)
        if (!userId || !parkId || !time || !date) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Create a new event instance
        const newEvent = new Event({
            userId,
            parkId,
            time,
            date,
        });

        // Save the new event to the database
        const savedEvent = await newEvent.save();

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
        const events = await Event.find().populate('userId').populate('parkId');
        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not retrieve events." });
    }
});

// GET route to fetch a specific event by ID
router.get("/:id", async (req, res) => {
    try {
        const eventId = req.params.id;

        // Find the event by ID and populate the referenced user and park
        const event = await Event.findById(eventId).populate('userId').populate('parkId');

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not retrieve event." });
    }
});

// PUT route to update an event by ID
router.put("/update/:id", async (req, res) => {
    try {
        const eventId = req.params.id;
        const { userId, parkId, time, date } = req.body;

        // Validate if all necessary fields are provided
        if (!userId || !parkId || !time || !date) {
            return res.status(400).json({ message: "All fields (userId, parkId, time, date) are required for updating the event." });
        }

        // Find the event by ID and update it
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { userId, parkId, time, date },
            { new: true, runValidators: true }  // new: true returns the updated document, runValidators: true ensures validation
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
router.delete("/delete/:id", async (req, res) => {
    try {
        const eventId = req.params.id;

        // Find the event by ID and delete it
        const deletedEvent = await Event.findByIdAndDelete(eventId);

        // If the event doesn't exist, return a 404 error
        if (!deletedEvent) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Respond with a success message
        res.status(200).json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Could not delete the event." });
    }
});

module.exports = router;