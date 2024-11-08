const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Assuming Bearer Token

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Check if userId (or _id) exists in the decoded token
    if (!decoded._id) {
      return res.status(400).json({ message: 'Token payload invalid: userId missing.' });
    }

    req.user = decoded; // Attach user info to request for downstream use
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authenticate;
