const express = require("express");
const cors = require("cors");
const app = express();
const fs = require('fs'); // Needed to read files from local temp storage
const upload = require('./config/multerConfig');  // Import Multer config
const s3 = require('./config/s3Config');  // Import AWS S3 config
const dbConnection = require("./config/db.config");
const cookieParser = require('cookie-parser');

// Import routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/userLoginSignup");
const eventRoutes = require("./routes/eventRoutes");
const parkRoutes = require("./routes/parkRoutes");
const dogRoutes = require("./routes/dogRoutes");
const refreshToken = require("./routes/refreshToken");

// Load environment variables
require("dotenv").config();



const SERVER_PORT = process.env.SERVER_PORT || 8081;

// Connect to the database
dbConnection();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8096', // Update with your frontend URL
    credentials: true, // Allow cookies to be sent
  })
);
app.use(express.json());
// For cookies
app.use(cookieParser());
// Middleware to handle URL-encoded form data
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/users", authRoutes);      // For login and signup
app.use("/users", userRoutes);      // For user CRUD operations (get, edit, delete, etc.)
app.use("/events", eventRoutes);    // For event-related CRUD operations
app.use("/parks", parkRoutes);      // For park routes
app.use("/dogs", dogRoutes);        // For dog routes
app.use("/auth", refreshToken);     // Refresh token route




// S3 Upload Route using Multer
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file; // File info provided by Multer
  
  const params = {
    Bucket: 'dogmeet',  // Replace with your S3 bucket name
    Key: file.filename,          // Use the unique filename generated by Multer
    Body: fs.createReadStream(file.path), // Read the file from temp storage
    ContentType: file.mimetype    // Set the correct file type
  };

  s3.upload(params, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }

    // Delete the file from the temp storage after uploading to S3
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error('Failed to delete temp file:', err);
      }
    });

    // Return the URL of the uploaded file
    res.status(200).send({ url: data.Location });
  });
});

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`The backend service is running on port ${SERVER_PORT} and waiting for requests.`);
});
