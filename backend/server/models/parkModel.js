const mongoose = require("mongoose");

//park schema/model
const newUserSchema = new mongoose.Schema(
  {
    parkName: {
      type: String,
      required: true,
      label: "username",
    },
    occupants: {
      type: String,
      required: true,
      label: "email",
    },
    eventId: {
      required: true,
      type: String,
      min : 8
    },
    image: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "parks" }
);

module.exports = mongoose.model('park', parkSchema)