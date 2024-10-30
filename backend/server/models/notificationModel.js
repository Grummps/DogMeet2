const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['friend_request', 'event_created'],
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    read: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('notifications', notificationSchema);
