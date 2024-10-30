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

// Transform _id to id in JSON responses
notificationSchema.method('toJSON', function () {
    const { _id, __v, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = mongoose.model('notifications', notificationSchema);
