const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const newUserModel = require('../models/userModel');
const { userLoginValidation, newUserValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');

// Route for user login
router.post('/login', async (req, res) => {
    const { error } = userLoginValidation(req.body);
    if (error) return res.status(400).send({ message: error.errors[0].message });

    const { username, password } = req.body;

    const user = await newUserModel.findOne({ username }).populate('parkId').populate('dogId').populate('friends').populate('eventId');

    if (!user) return res.status(401).send({ message: "Username or password does not exist, try again" });

    const checkPasswordValidity = await bcrypt.compare(password, user.password);
    if (!checkPasswordValidity) return res.status(401).send({ message: "Username or password does not exist, try again" });

    const accessToken = generateAccessToken(user._id, user.email, user.username, user.password);
    res.header('Authorization', accessToken).send({ accessToken });
});

// Route for user signup
router.post('/signup', async (req, res) => {
    const { error } = newUserValidation(req.body);
    if (error) return res.status(400).send({ message: error.errors[0].message });

    const { username, email, password, parkId, dogId, friends, eventId } = req.body;

    const existingUser = await newUserModel.findOne({ username });
    if (existingUser) return res.status(409).send({ message: "Username is taken, pick another" });

    const generateHash = await bcrypt.genSalt(Number(10));
    const hashPassword = await bcrypt.hash(password, generateHash);

    const createUser = new newUserModel({
        username,
        email,
        password: hashPassword,
        parkId,
        dogId,
        friends: friends ? friends.map(id => mongoose.Types.ObjectId(id)) : [],
        eventId
    });

    try {
        const saveNewUser = await createUser.save();
        res.send(saveNewUser);
    } catch (error) {
        res.status(400).send({ message: "Error trying to create new user" });
    }
});

module.exports = router;
