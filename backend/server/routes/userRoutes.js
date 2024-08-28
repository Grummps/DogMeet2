const express = require("express");
const router = express.Router();
const z = require("zod");
const bcrypt = require("bcrypt");
const newUserModel = require('../models/userModel');
const { newUserValidation, userLoginValidation } = require('../models/userValidator');
const { generateAccessToken } = require('../utilities/generateToken');

// Route to delete all users
router.post('/deleteAll', async (req, res) => {
    const user = await newUserModel.deleteMany();
    return res.json(user);
});

// Route to edit a user
router.post('/editUser', async (req, res) => {
    // Validate new user information
    const { error } = newUserValidation(req.body);
    if (error) return res.status(400).send({ message: error.errors[0].message });

    // Store new user information
    const { userId, username, email, password } = req.body;

    // Check if username is available
    const user = await newUserModel.findOne({ username: username });
    if (user) {
        const userIdReg = JSON.stringify(user._id).replace(/["]+/g, '');
        if (userIdReg !== userId) return res.status(409).send({ message: "Username is taken, pick another" });
    }

    // Generate the hash
    const generateHash = await bcrypt.genSalt(Number(10));

    // Parse the generated hash into the password
    const hashPassword = await bcrypt.hash(password, generateHash);

    // Find and update user using stored information
    newUserModel.findByIdAndUpdate(userId, {
        username: username, 
        email: email, 
        password: hashPassword
    }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            // Create and send new access token to local storage
            const accessToken = generateAccessToken(user._id, email, username, hashPassword);
            res.header('Authorization', accessToken).send({ accessToken: accessToken });
        }
    });
});

// Route to get all users
router.get('/getAll', async (req, res) => {
    const user = await newUserModel.find();
    return res.json(user);
});

// Route to get a user by ID
router.get("/getUserById", async (req, res) => {
    const { userId } = req.body;

    newUserModel.findById(userId, function (err, user) {
        if (err) {
            console.log(err);
        }
        if (user == null) {
            res.status(404).send("userId does not exist.");
        } else {
            return res.json(user);
        }
    });
});

module.exports = router;