const mongoose = require("mongoose");
const { Schema } = mongoose;

// Dog schema/model
const dogSchema = new mongoose.Schema(
  {
    dogName: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
      enum: ["small", "medium", "large"], // Restrict size to specific options
    },
    image: {
      type: String, // URL of the image stored in S3
      required: false,
    },
    ownerId: {
      type: Schema.Types.ObjectId, // Reference to the user who owns the dog
      ref: 'users', // Assuming your users collection is named 'users'
      required: true,
    },
  },
  { collection: "dogs" }
);

module.exports = mongoose.model('dogs', dogSchema);
