const verifyToken = require('../utilities/verifyToken');

const socketAuth = async (socket, next) => {
  // Extract token from handshake auth (recommended way)
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log('Socket authentication failed: Token missing');
    const err = new Error('Authentication error');
    err.data = { message: 'Authentication token missing.' }; // Additional details
    return next(err);
  }

  try {
    const decoded = await verifyToken(token);
    console.log('Decoded token payload:', decoded); // Log payload to confirm userId presence

    // Attach user info to socket for downstream use
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('Socket token verification failed:', error.message);
    const err = new Error('Authentication error');
    err.data = { message: 'Invalid or expired token.' }; // Additional details
    return next(err);
  }
};

module.exports = socketAuth;
