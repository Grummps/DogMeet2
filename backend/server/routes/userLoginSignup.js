const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const newUserModel = require('../models/userModel');
const { userLoginValidation, newUserValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');

// Route for user login
router.post('/login', async (req, res) => {
    const { error } = userLoginValidation(req.body);
    if (error) return res.status(400).send({ message: error.errors[0].message });

    const { username, password } = req.body;

    const user = await newUserModel.findOne({ username: username });

    // Check if the user exists
    if (!user)
        return res.status(401).send({ message: "Username or password does not exist, try again" });

    // Check if the password is correct
    const checkPasswordValidity = await bcrypt.compare(password, user.password);

    if (!checkPasswordValidity)
        return res.status(401).send({ message: "Username or password does not exist, try again" });

    // Create JSON Web Token if authenticated and send it back to client in the header
    const accessToken = generateAccessToken(user._id, user.email, user.username, user.password);
    res.header('Authorization', accessToken).send({ accessToken: accessToken });
});

// Route for user signup
router.post('/signup', async (req, res) => {
    const { error } = newUserValidation(req.body);
    console.log(error);
    if (error) return res.status(400).send({ message: error.errors[0].message });

    const { username, email, password } = req.body;

    // Check if username already exists
    const user = await newUserModel.findOne({ username: username });
    if (user)
        return res.status(409).send({ message: "Username is taken, pick another" });

    // Generate the hash
    const generateHash = await bcrypt.genSalt(Number(10));

    // Parse the generated hash into the password
    const hashPassword = await bcrypt.hash(password, generateHash);

    // Create a new user
    const createUser = new newUserModel({
        username: username,
        email: email,
        password: hashPassword,
    });

    try {
        const saveNewUser = await createUser.save();
        res.send(saveNewUser);
    } catch (error) {
        res.status(400).send({ message: "Error trying to create new user" });
    }
});

module.exports = router;