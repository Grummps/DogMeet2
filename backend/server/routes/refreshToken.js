const express = require('express');
const { generateAccessToken, generateRefreshToken } = require('../utilities/generateToken');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error('Refresh token verification failed:', err);
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
        };

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);

        // Implement Refresh Token Rotation
        // Generate a new refresh token and invalidate the old one
        const newRefreshToken = generateRefreshToken(user);

        // Set the new refresh token in the cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Ensure HTTPS in production
            sameSite: 'None', // Use 'None' if your frontend and backend are on different domains
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/', // Ensure the cookie is accessible across the entire site
        });

        res.json({ accessToken: newAccessToken });
    });
});

module.exports = router;
