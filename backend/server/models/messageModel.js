const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
            immutable: true,
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
            immutable: true,
        },
        chatRoomId: {
            type: Schema.Types.ObjectId,
            ref: "chatRooms",
            required: true,
            immutable: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 2000,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            required: true,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },
        readBy: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'users',
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { collection: "messages" }
);

messageSchema.index({ chatRoomId: 1, senderId: 1, receiverId: 1 });

module.exports = mongoose.model("messages", messageSchema);
