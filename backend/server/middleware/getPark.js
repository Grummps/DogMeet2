const mongoose = require('mongoose');
const Park = require('../models/parkModel');

const getPark = async (req, res, next) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: 'Invalid park ID.' });
  }

  try {
    const park = await Park.findById(_id).populate({
      path: 'eventId',
      populate: {
        path: 'parkId',
        select: 'parkName', // Only select necessary fields
      },
    });

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