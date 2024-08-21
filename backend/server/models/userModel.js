const mongoose = require("mongoose");

//user schema/model
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
      min : 8
    },
    parkId: {
      type: Date,
      default: Date.now,
    },
    dogId: {

    },
    friends: {

    },
    eventId: {

    },
  },
  { collection: "users" }
);

module.exports = mongoose.model('users', newUserSchema)