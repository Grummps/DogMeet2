const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id, 
      email: user.email, 
      username: user.username, 
      isAdmin: user.isAdmin 
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '10s' } // Access token valid for 60 minutes
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id, 
      email: user.email, 
      username: user.username, 
      isAdmin: user.isAdmin 
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh token valid for 7 days
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
