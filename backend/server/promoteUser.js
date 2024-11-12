const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
// Replace with your actual MongoDB connection string
const mongoURI = `${process.env.DB_URL}`;

// Import your User model
const User = require('./models/userModel'); // Adjust the path if necessary

// Function to promote a user to admin
const promoteUser = async (username) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Update the user's isAdmin field
        const result = await User.updateOne(
            { username: username },           // Query to find the user
            { $set: { isAdmin: true } }       // Update operation
        );

        if (result.nModified === 0) {
            console.log('No user found or user is already an admin.');
        } else {
            console.log(`User "${username}" has been promoted to admin.`);
        }
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

const usernameToPromote = 'Beepers';
promoteUser(usernameToPromote);
