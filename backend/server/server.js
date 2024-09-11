const express = require("express");
const app = express();
const cors = require("cors");
const userRoutes = require("./routes/userRoutes"); // Consolidate all user-related routes in one module
const authRoutes = require("./routes/userLoginSignup"); // Authentication (login/register)
const eventRoutes = require("./routes/eventRoutes"); // Event-related CRUD routes
const parkRoutes = require("./routes/parkRoutes"); // Park CRUD routes
const dogRoutes = require("./routes/dogRoutes")    // Dog CRUD routes
const dbConnection = require("./config/db.config");

require("dotenv").config();
const SERVER_PORT = process.env.SERVER_PORT || 8081;

// Connect to the database
dbConnection();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/user", authRoutes);      // For login and signup
app.use("/user", userRoutes);      // For user CRUD operations (get, edit, delete, etc.)
app.use("/events", eventRoutes);   // For event-related CRUD operations
app.use("/parks", parkRoutes);      // For park routes
app.use("/dogs", dogRoutes)        // For dog routes

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`The backend service is running on port ${SERVER_PORT} and waiting for requests.`);
});
