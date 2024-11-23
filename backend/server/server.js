const express = require("express");
const cors = require("cors");
const app = express();
const dbConnection = require("./config/db.config");
const cookieParser = require('cookie-parser');
const http = require('http');
const rateLimit = require('express-rate-limit');

// Import routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/userLoginSignup");
const eventRoutes = require("./routes/eventRoutes");
const parkRoutes = require("./routes/parkRoutes");
const dogRoutes = require("./routes/dogRoutes");
const refreshToken = require("./routes/refreshToken");
const messageRoutes = require("./routes/messageRoutes");
const mapRoutes = require("./routes/mapRoutes");
const chatRoomRoutes = require("./routes/chatRoomRoutes");

// Load environment variables
require("dotenv").config();

const port = process.env.PORT || 8081;
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:8096';

// Define rate limiter for /directions
const directionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Connect to the database
dbConnection();

// Middleware
app.use(
  cors({
    origin: allowedOrigin, // Update with your frontend URL
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
app.use("/messages", messageRoutes);// For message routes
app.use("/directions", directionsLimiter, mapRoutes);  // For map routes
app.use("/chatRooms", chatRoomRoutes);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const { initializeSocket } = require('./socket/socketConfig');
initializeSocket(server);

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`The backend service is running on port ${port} and waiting for requests.`);
});
