const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        color: String,
        price: Number,
      },
    ],
    totalCartPrice: Number,
    totalPriceAfterDiscount: Number,
    // name of the coupon applied on the cart (cleared when the cart changes)
    coupon: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);