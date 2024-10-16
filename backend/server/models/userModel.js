const mongoose = require("mongoose");
const { Schema } = mongoose;

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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      required: true,
      type: String,
      min: 8,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    parkId: {
      type: Schema.Types.ObjectId,
      ref: 'parks',
      required: false,
    },
    dogId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'dogs',
      }
    ],
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      }
    ],
    eventId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'events',
      }
    ],
  },
  { collection: "users" }
);

module.exports = mongoose.model('users', newUserSchema);
