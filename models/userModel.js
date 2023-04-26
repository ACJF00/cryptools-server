const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    address: {
      type: String,
      required: false,
    },
    pic: {
      type: String,
      required: true,
      default: "https://bitcoin.org/img/icons/opengraph.png?1662473327",
    },
    monitoredToken: [
      {
        logo: {
          type: String,
          required: true,
        },
        ticker: {
          type: String,
          required: true,
        },
        blockchain: {
          type: String,
          required: true,
        },
        contract: {
          type: Object,
          required: true,
          default: {},
        },
        to_receive: {
          type: Number,
          required: true,
          default: 0,
        },
        receivedAmount: {
          type: Number,
          required: true,
          default: 0,
        },
        decimals: {
          type: Object,
          required: true,
          default: {},
        },
        lastUpdate: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
