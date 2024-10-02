const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Park = require('../models/parkModel');
const authenticate = require('../middleware/auth');
const authorizeAdmin = require('../middleware/authAdmin');

// Create a new park (Admin Only)
router.post('/create', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { parkName, occupants, eventId, image, location } = req.body;

    // Validate required fields
    if (!parkName || !location) { // Assuming location is required now
      return res.status(400).json({ message: 'Park name and location are required.' });
    }

    // Create a new park
    const newPark = new Park({
      parkName,
      occupants: occupants ? occupants.map(id => mongoose.Types.ObjectId(id)) : [],
      eventId: eventId ? eventId.map(id => mongoose.Types.ObjectId(id)) : [],
      image,
      location, // Add location field
    });

    const savedPark = await newPark.save();
    res.status(201).json(savedPark);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating park.' });
  }
});
  
  // Get all parks
  router.get('/all', async (req, res) => {
    try {
      const parks = await Park.find().populate('occupants').populate('eventId');
      res.status(200).json(parks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching parks.' });
    }
  });
  
  // Get a specific park by ID
  router.get('/:id', async (req, res) => {
    try {
      const parkId = req.params.id;
  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID.' });
      }
  
      const park = await Park.findById(parkId).populate('occupants').populate('eventId');
      if (!park) {
        return res.status(404).json({ message: 'Park not found.' });
      }
  
      res.status(200).json(park);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching park.' });
    }
  });
  
  // Update a park by ID
  router.put('/update/:id', async (req, res) => {
    try {
      const parkId = req.params.id;
      const { parkName, occupants, eventId, image } = req.body;
  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID.' });
      }
  
      const updatedPark = await Park.findByIdAndUpdate(
        parkId,
        {
          parkName,
          occupants: occupants ? occupants.map(id => mongoose.Types.ObjectId(id)) : [],
          eventId: eventId ? eventId.map(id => mongoose.Types.ObjectId(id)) : [], // Handle optional eventId
          image
        },
        { new: true, runValidators: true }
      ).populate('occupants').populate('eventId');
  
      if (!updatedPark) {
        return res.status(404).json({ message: 'Park not found.' });
      }
  
      res.status(200).json(updatedPark);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating park.' });
    }
  });
  
  
  // Delete a park by ID
  router.delete('/delete/:id', async (req, res) => {
    try {
      const parkId = req.params.id;
  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(parkId)) {
        return res.status(400).json({ message: 'Invalid park ID.' });
      }
  
      const deletedPark = await Park.findByIdAndDelete(parkId);
  
      if (!deletedPark) {
        return res.status(404).json({ message: 'Park not found.' });
      }
  
      res.status(200).json({ message: 'Park deleted successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting park.' });
    }
  });
  
  module.exports = router;