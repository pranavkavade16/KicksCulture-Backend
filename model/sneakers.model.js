const mongoose = require("mongoose");

const sneakersSchema = new mongoose.Schema(
  {
    sneakerName: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      enum: [
        "Nike",
        "Adidas Originals",
        "Jordan",
        "New Balance",
        "Puma",
        "Converse",
        "Asics",
        "Reebok",
      ],
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Men", "Female", "Unisex"],
    },
    price: {
      type: Number,
      required: true,
    },
    isNewArrival: {
      type: Boolean,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    colors: {
      type: String,
      required: true,
    },
    sizeAvailable: [{
      type: Number,
      required: true,
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    isReturnAvailable: {
      type: Boolean,
      required: true,
    },
    returnPeriod: {
      type: Number,
      required: true,
    },
    isPayOnDeliveryAvailable: {
      type: Boolean,
      required: true,
    },
    isFreeDeliveryAvailable: {
      type: Boolean,
      required: true,
    },
    isSecurePayment: {
      type: Boolean,
      default: true,
    },
    image1Url: {
      type: String,
      required: true,
    },
    image2Url: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sneakers = mongoose.model("Sneakers", sneakersSchema);
module.exports = Sneakers;
