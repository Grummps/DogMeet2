const express = require('express');
const { generateAccessToken } = require('../utilities/generateToken')
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });

        // Generate a new access token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '60m' }
        );

        res.json({ accessToken });
    });
});

module.exports = router;