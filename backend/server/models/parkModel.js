const mongoose = require("mongoose");
const { Schema } = mongoose;

// Park schema/model
const parkSchema = new mongoose.Schema(
  {
    parkName: {
      type: String,
      required: true,
    },
    occupants: {
      type: String,  // Assuming this is a text field indicating the number or names of occupants
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,  // Reference to a document in the events collection
      ref: 'events',  // Assuming your events collection is named 'events'
      required: true,
    },
    image: {
      type: String,  // URL or S3 key for the park's image
      required: false,  // Optional if you don't always have an image
    },
  },
  { collection: "parks" }
);

module.exports = mongoose.model('park', parkSchema);
