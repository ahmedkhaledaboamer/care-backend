const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

const Product = require('../models/productsModels');
const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');

// the price a customer pays: sale price when there is a valid one
const unitPrice = (product) =>
  product.priceAfterDiscount && product.priceAfterDiscount < product.price
    ? product.priceAfterDiscount
    : product.price;

const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });
  cart.totalCartPrice = Math.round(totalPrice * 100) / 100;
  // any change to the cart removes the applied coupon
  cart.totalPriceAfterDiscount = undefined;
  cart.coupon = undefined;
  return totalPrice;
};

const sendCart = (res, cart, message) =>
  res.status(200).json({
    status: 'success',
    ...(message ? { message } : {}),
    numOfCartItems: cart ? cart.cartItems.length : 0,
    data: cart || { cartItems: [], totalCartPrice: 0 },
  });

// @desc    Add product to  cart
// @route   POST /api/v1/cart
// @access  Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ApiError(`There is no product with id ${productId}`, 404));
  }
  if (product.quantity <= 0) {
    return next(new ApiError('This product is out of stock', 400));
  }

  // 1) Get Cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });
  const price = unitPrice(product);

  if (!cart) {
    // create cart fot logged user with product
    cart = new Cart({
      user: req.user._id,
      cartItems: [{ product: productId, color, price }],
    });
  } else {
    // product exist in cart, update product quantity
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && (item.color || undefined) === (color || undefined)
    );

    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      if (cartItem.quantity + 1 > product.quantity) {
        return next(new ApiError(`Only ${product.quantity} items available in stock`, 400));
      }
      cartItem.quantity += 1;
      cartItem.price = price;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // product not exist in cart,  push product to cartItems array
      cart.cartItems.push({ product: productId, color, price });
    }
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();

  sendCart(res, cart, 'Product added to cart successfully');
});

// @desc    Get logged user cart (an empty cart when the user has none)
// @route   GET /api/v1/cart
// @access  Private/User
exports.getLoggedUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  sendCart(res, cart);
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Private/User
exports.removeSpecificCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  );
  if (!cart) return sendCart(res, null);

  calcTotalCartPrice(cart);
  await cart.save();

  sendCart(res, cart);
});

// @desc    clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Private/User
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(204).send();
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new ApiError('Quantity must be a whole number greater than 0', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`there is no cart for user ${req.user._id}`, 404));
  }

  const itemIndex = cart.cartItems.findIndex((item) => item._id.toString() === req.params.itemId);
  if (itemIndex === -1) {
    return next(new ApiError(`there is no item for this id :${req.params.itemId}`, 404));
  }

  const cartItem = cart.cartItems[itemIndex];
  const product = await Product.findById(cartItem.product);
  if (product && quantity > product.quantity) {
    return next(new ApiError(`Only ${product.quantity} items available in stock`, 400));
  }
  cartItem.quantity = quantity;
  if (product) cartItem.price = unitPrice(product);
  cart.cartItems[itemIndex] = cartItem;

  calcTotalCartPrice(cart);
  await cart.save();

  sendCart(res, cart);
});

// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const name = String(req.body.coupon || '').trim();
  // 1) Get coupon based on coupon name (case-insensitive)
  const coupon = await Coupon.findOne({
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    expire: { $gt: Date.now() },
  });

  if (!name || !coupon) {
    return next(new ApiError('Coupon is invalid or expired', 400));
  }

  // 2) Get logged user cart to get total cart price
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.cartItems.length === 0) {
    return next(new ApiError('Your cart is empty', 400));
  }

  const totalPrice = cart.totalCartPrice;

  // 3) Calculate price after priceAfterDiscount
  const totalPriceAfterDiscount = Math.round((totalPrice - (totalPrice * coupon.discount) / 100) * 100) / 100;

  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  cart.coupon = coupon.name;
  await cart.save();

  sendCart(res, cart);
});
