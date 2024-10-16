const mongoose = require("mongoose");
const { Schema } = mongoose;

// Event schema/model
const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the users collection
      ref: 'users',  // Assuming your users collection is named 'users'
      required: true,
    },
    parkId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the parks collection
      ref: 'parks',  // Assuming your parks collection is named 'parks'
      required: true,
    },
    time: {
      type: String,  // Store time as a string in 24-hour HH:mm format
      required: true,
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: props => `${props.value} is not a valid time format! Expected format is HH:mm in 24-hour time.`
      }
    },
    date: {
      type: Date,  // Store the event's date
      required: true,
      default: Date.now,
    },
  },
  { collection: "events" }
);

module.exports = mongoose.model('events', eventSchema);
