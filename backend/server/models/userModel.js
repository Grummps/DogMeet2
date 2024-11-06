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
        default: [],
      }
    ],
    friendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: [],
      }
    ],
    eventId: [
      {
        type: Schema.Types.ObjectId,
        ref: 'events',
      }
    ],
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'notifications',
      }
    ],
    image: {
      type: String, // URL of the image stored in S3
      required: false,
    },
    imageKey: {
      type: String,
      required: false,
    },
  },
  { 
    collection: "users",
    timestamps: true,
  }
);


module.exports = mongoose.model('users', newUserSchema);
