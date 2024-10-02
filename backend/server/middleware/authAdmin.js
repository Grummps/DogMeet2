const User = require('../models/userModel'); // Adjust the path as needed

const authorizeAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming the JWT contains the user's ID
    const user = await User.findById(userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next(); // User is admin, proceed to the next middleware/route handler
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = authorizeAdmin;
