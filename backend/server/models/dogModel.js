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

// This function can be used to generate the full S3 URL for the image
dogSchema.methods.getImageUrl = function () {
  const s3BaseUrl = process.env.S3_BASE_URL;  // Base URL for your S3 bucket, stored in an environment variable
  return `${s3BaseUrl}/${this.image}`;
};

module.exports = mongoose.model('dogs', dogSchema);