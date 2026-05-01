const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    flatNumber: {
      type: String,
    },
    completeAddress: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    defaultAddress: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
