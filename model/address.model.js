const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    pinCode: {
      type: String,
      required: true,
    },
    flatNo: {
      type: String,
    },
    address: {
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
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
