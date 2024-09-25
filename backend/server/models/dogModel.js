const mongoose = require("mongoose");

// Dog schema/model
const dogSchema = new mongoose.Schema(
  {
    dogName: {
      type: String,
      required: true,
      label: "dogName",
    },
    size: {
      type: String,
      required: true,
      enum: ["small", "medium", "large"],  // Restrict size to specific options
      label: "size",
    },
    image: {
      type: String,  // URL of the image stored in S3
      required: false,
      label: "image",
    },
  },
  { collection: "dogs" }
);

module.exports = mongoose.model('dogs', dogSchema);
