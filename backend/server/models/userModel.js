const mongoose = require("mongoose");
const { Schema } = mongoose;

// User schema/model
const newUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      label: "username",
    },
    email: {
      type: String,
      required: true,
      label: "email",
    },
    password: {
      required: true,
      type: String,
      min: 8,
    },
    parkId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the parks collection
      ref: 'parks',  // Assuming your parks collection is named 'parks'
      required: false,  // Set to true if a user must always be linked to a park
    },
    dogId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the dogs collection
      ref: 'dogs',  // Assuming your dogs collection is named 'dogs'
      required: false,  // Set to true if a user must always have a dog
    },
    friends: {
      type: [Schema.Types.ObjectId],  // Array of ObjectIds referencing other users
      ref: 'users',  // Self-referencing the same collection
      required: false,  // Set to true if a user must have friends
    },
    eventId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the events collection
      ref: 'events',  // Assuming your events collection is named 'events'
      required: false,  // Set to true if a user must be linked to an event
    },
  },
  { collection: "users" }
);

module.exports = mongoose.model('users', newUserSchema);
