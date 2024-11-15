const mongoose = require("mongoose");
const { Schema } = mongoose;

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
        default: [],
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
    duration: {
      type: Number, // Duration in minutes
      default: 60,  // Default to 60 minutes if not specified
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { collection: "events" }
);


// TTL index to automatically delete documents after `expiresAt`
eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('events', eventSchema);
