const mongoose = require("mongoose");
const { Schema } = mongoose;

// GeoJSON Point Schema
const pointSchema = new Schema({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
    default: "Point",
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

// Park schema/model
const parkSchema = new mongoose.Schema(
  {
    parkName: {
      type: String,
      required: true,
    },
    occupants: [
      {
        type: Schema.Types.ObjectId, // Array of ObjectIds referencing the users collection
        ref: 'dogs', 
      }
    ],
    eventId: [
      {
        type: Schema.Types.ObjectId, // Array of ObjectIds referencing events for this park
        ref: 'events',
        required: false,
      }
    ],
    location: {
      type: pointSchema,
      required: true,
    },
  },
  { collection: "parks" }
);

// Create a 2dsphere index for geospatial queries (optional but recommended)
parkSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('parks', parkSchema);
