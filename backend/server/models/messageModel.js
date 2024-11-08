const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "conversations",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        readStatus: {
            type: Boolean,
            default: false,
            required: true,
        },
        messageType: {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },
    },
    { collection: "messages" }
);

module.exports = mongoose.model("messages", messageSchema);
