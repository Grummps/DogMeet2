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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        console.log('No refresh token provided');
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        // Verify the refresh token
        const decoded = await verifyRefreshToken(refreshToken);
        console.log('Refresh token decoded:', decoded);

        // Check if the required fields are present in the decoded token
        const { id, email, username, isAdmin } = decoded;
        if (!id) throw new Error('Decoded token missing user ID');

        const user = { id, email, username, isAdmin };

        // Generate new tokens
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Set the new refresh token in the cookie, overwriting the old one
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Ensure HTTPS in production
            sameSite: 'Lax', // Consider 'Lax' if your frontend and backend are on different domains
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/', // Ensure the cookie is accessible across the entire site
        });

        res.json({ accessToken: newAccessToken });
        console.log('Tokens successfully refreshed');
    } catch (error) {
        console.error('Error in refresh-token route:', error.message);
        res.status(403).json({ message: error.message });
    }
});

module.exports = router;
