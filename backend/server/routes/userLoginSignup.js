const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const newUserModel = require('../models/userModel');
const { userLoginValidation, newUserValidation } = require('../models/userValidator');
const { generateAccessToken, generateRefreshToken } = require('../utilities/generateToken'); // Import both functions

// Route for user login
router.post('/login', async (req, res) => {
  // Validate login input
  const validationResult = userLoginValidation(req.body);
  if (!validationResult.success) {
    // Extract the error message from validationResult.error
    const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
    return res.status(400).send({ message: errorMessage });
  }

  const { username, password } = req.body;

  try {
    // Find user by username and populate necessary fields
    const user = await newUserModel.findOne({ username })
      .populate('parkId')
      .populate('dogId')
      .populate('friends')
      .populate('eventId');

    if (!user) {
      return res.status(401).send({ message: "Username or password is incorrect." });
    }

    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: "Username or password is incorrect." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send the access token in the response
    res.status(200).send({ accessToken, refreshToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ message: "Internal server error." });
  }
});


// Route for user signup
router.post('/signup', async (req, res) => {
  // Perform validation using safeParse
  const validationResult = newUserValidation(req.body);

  // Check if validation failed
  if (!validationResult.success) {
    // Extract the first error message
    const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
    return res.status(400).send({ message: errorMessage });
  }

  const { username, email, password, parkId, dogId, friends, eventId } = req.body;

  try {
    // Check if username already exists
    const existingUser = await newUserModel.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (existingUser) {
      return res.status(409).send({ message: "Username is taken, pick another" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create the new user
    const createUser = new newUserModel({
      username,
      email,
      password: hashPassword,
      isAdmin: false,
      parkId,
      dogId,
      friends: friends ? friends.map(_id => mongoose.Types.ObjectId(_id)) : [],
      eventId,
    });

    // Save the user to the database
    const savedUser = await createUser.save();

    // Generate tokens
    const accessToken = generateAccessToken(savedUser);
    const refreshToken = generateRefreshToken(savedUser);

    // Send the access token in the response
    res.status(201).send({ accessToken, refreshToken });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).send({ message: "Internal server error." });
  }
});


// In userLoginSignup.js or a separate route file
router.post('/logout', (req, res) => {
  res.status(200).send({ message: 'Logged out successfully' });
});


module.exports = router;