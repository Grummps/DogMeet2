const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatRoomSchema = new Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: function () {
        return this.isGroup;
      },
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        firstMessageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "messages",
          default: null,
        },
      },
    ],
    hiddenTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: function () {
        return this.isGroup;
      },
    },
  },
  { collection: 'chatRooms' }
);

chatRoomSchema.index({ "participants.userId": 1 });

module.exports = mongoose.model('chatRoom', chatRoomSchema);
