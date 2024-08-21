const mongoose = require("mongoose");

//event schema/model
const newUserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      label: "username",
    },
    parkId: {
      type: String,
      required: true,
      label: "email",
    },
    time: {
      required: true,
      type: String,
      min : 8
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "events" }
);

module.exports = mongoose.model('events', eventSchema)