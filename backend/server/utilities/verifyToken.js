const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      if (!decoded._id) {
        return reject(new Error('Token payload invalid: userId missing.'));
      }
      resolve(decoded);
    });
  });
};

module.exports = verifyToken;
