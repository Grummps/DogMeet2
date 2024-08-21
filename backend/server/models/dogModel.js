const mongoose = require("mongoose");

//dog schema/model
const newUserSchema = new mongoose.Schema(
  {
    dogName: {
      type: String,
      required: true,
      label: "username",
    },
    size: {
      type: String,
      required: true,
      label: "email",
    },
    image: {
      required: true,
      type: String,
      min : 8
    },
  },
  { collection: "dogs" }
);

module.exports = mongoose.model('dogs', dogSchema)