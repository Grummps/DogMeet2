// models/eventModel.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Event schema/model
const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    parkId: {
      type: Schema.Types.ObjectId,
      ref: 'parks',
      required: true,
    },
    dogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'dogs',
        required: true,
      }
    ],
    time: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: (props) => `${props.value} is not a valid time format! Expected format is HH:mm in 24-hour time.`,
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { collection: "events" }
);

module.exports = mongoose.model('events', eventSchema);
