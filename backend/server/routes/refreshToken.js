const express = require('express');
const { generateAccessToken, generateRefreshToken } = require('../utilities/generateToken');
const jwt = require('jsonwebtoken');
const router = express.Router();

const verifyRefreshToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) return reject(new Error('Invalid or expired refresh token'));
            resolve(decoded);
        });
    });
};

router.post('/refresh-token', async (req, res) => {
    const refreshToken = req.body.refreshToken; // Expect refreshToken in the request body

    if (!refreshToken) {
        console.log('No refresh token provided');
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = await verifyRefreshToken(refreshToken);
        const { _id, email, username, isAdmin } = decoded;

        if (!_id) throw new Error('Decoded token missing user ID');

        const user = { _id, email, username, isAdmin };

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Error in refresh-token route:', error.message);
        res.status(403).json({ message: error.message });
    }
});


module.exports = router;
