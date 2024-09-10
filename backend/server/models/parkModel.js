const mongoose = require("mongoose");
const { Schema } = mongoose;

// Park schema/model
const parkSchema = new mongoose.Schema(
  {
    parkName: {
      type: String,
      required: true,
    },
    occupants: [
      {
        type: Schema.Types.ObjectId,  // Array of ObjectIds referencing the users collection
        ref: 'users',  // Assuming your users collection is named 'users'
      }
    ],
    eventId: [
      {
      type: Schema.Types.ObjectId,  // Array of ObjectIds referencing events for this park
      ref: 'events',  // Assuming your events collection is named 'events'
      required: false,
      }
  ],
    image: {
      type: String,  // URL or S3 key for the park's image
      required: false,  // Optional if you don't always have an image
    },
  },
  { collection: "parks" }
);

module.exports = mongoose.model('parks', parkSchema);