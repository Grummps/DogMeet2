const mongoose = require('mongoose');
const Park = require('../models/parkModel');

const getPark = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid park ID.' });
  }

  try {
    const park = await Park.findById(id).populate('eventId');
    if (!park) {
      return res.status(404).json({ message: 'Park not found.' });
    }
    req.park = park; // Attach park to request object
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching park.' });
  }
};

module.exports = getPark;