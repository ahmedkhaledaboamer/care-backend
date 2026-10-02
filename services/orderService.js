// eslint-disable-next-line import/no-extraneous-dependencies
const Stripe = require('stripe');

const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');

const User = require('../models/userModels');
const Product = require('../models/productsModels');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

const stripe = () => {
  if (!process.env.STRIPE_SECRET) throw new ApiError('Card payments are not configured', 400);
  return Stripe(process.env.STRIPE_SECRET);
};

// app settings
const TAX_PRICE = Number(process.env.TAX_PRICE) || 0;
const SHIPPING_PRICE = Number(process.env.SHIPPING_PRICE) || 0;

// Loads the logged user's cart and makes sure it can be ordered
const getOrderableCart = async (req) => {
  const cart = await Cart.findById(req.params.cartId);
  if (!cart || cart.user.toString() !== req.user._id.toString()) {
    throw new ApiError(`There is no such cart with id ${req.params.cartId}`, 404);
  }
  if (cart.cartItems.length === 0) {
    throw new ApiError('Your cart is empty', 400);
  }

  // stock check
  const products = await Product.find({ _id: { $in: cart.cartItems.map((i) => i.product) } }).select('title quantity');
  const missing = cart.cartItems.find((item) => {
    const product = products.find((p) => p._id.toString() === item.product.toString());
    return !product || product.quantity < item.quantity;
  });
  if (missing) {
    throw new ApiError('Some items in your cart are no longer available in this quantity', 400);
  }
  return cart;
};

const cartPrice = (cart) =>
  Number(cart.totalPriceAfterDiscount != null ? cart.totalPriceAfterDiscount : cart.totalCartPrice) || 0;

const updateStockAndClearCart = async (cart) => {
  const bulkOption = cart.cartItems.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
    },
  }));
  await Product.bulkWrite(bulkOption, {});
  await Cart.findByIdAndDelete(cart._id);
};

// @desc    create cash order
// @route   POST /api/v1/orders/cartId
// @access  Protected/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress || !shippingAddress.details || !shippingAddress.phone || !shippingAddress.city) {
    return next(new ApiError('Shipping address (details, phone, city) is required', 400));
  }

  // 1) Get cart depend on cartId
  const cart = await getOrderableCart(req);

  // 2) Get order price depend on cart price "Check if coupon apply"
  const totalOrderPrice = cartPrice(cart) + TAX_PRICE + SHIPPING_PRICE;

  // 3) Create order with default paymentMethodType cash
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    taxPrice: TAX_PRICE,
    shippingPrice: SHIPPING_PRICE,
    totalOrderPrice,
  });

  // 4) After creating order, decrement product quantity, increment product sold
  // 5) Clear cart depend on cartId
  await updateStockAndClearCart(cart);

  res.status(201).json({ status: 'success', data: order });
});

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'user') req.filterObj = { user: req.user._id };
  next();
});
// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Protected/User-Admin-Manager
exports.findAllOrders = factory.getAll(Order);

// @desc    Get specific order (users can only see their own orders)
// @route   GET /api/v1/orders/:id
// @access  Protected/User-Admin-Manager
exports.findSpecificOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  const ownerId = order && order.user && (order.user._id || order.user).toString();
  if (!order || (req.user.role === 'user' && ownerId !== req.user._id.toString())) {
    return next(new ApiError(`There is no such a order with this id:${req.params.id}`, 404));
  }
  res.status(200).json({ data: order });
});

const setOrderFlag = (flag, dateField) =>
  asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ApiError(`There is no such a order with this id:${req.params.id}`, 404));
    }
    order[flag] = true;
    order[dateField] = Date.now();
    const updatedOrder = await order.save();
    res.status(200).json({ status: 'success', data: updatedOrder });
  });

// @desc    Update order paid status to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Protected/Admin-Manager
exports.updateOrderToPaid = setOrderFlag('isPaid', 'paidAt');

// @desc    Update order delivered status
// @route   PUT /api/v1/orders/:id/deliver
// @access  Protected/Admin-Manager
exports.updateOrderToDelivered = setOrderFlag('isDelivered', 'deliveredAt');

// @desc    Get checkout session from stripe and send it as response
// @route   POST /api/v1/orders/checkout-session/cartId   (body: { shippingAddress })
// @access  Protected/User
exports.checkoutSession = asyncHandler(async (req, res) => {
  const cart = await getOrderableCart(req);
  const totalOrderPrice = cartPrice(cart) + TAX_PRICE + SHIPPING_PRICE;
  const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  const shippingAddress = (req.body && req.body.shippingAddress) || {};

  const session = await stripe().checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: (process.env.CURRENCY || 'aed').toLowerCase(),
          unit_amount: Math.round(totalOrderPrice * 100),
          product_data: { name: `Royal Care order - ${req.user.name}` },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${frontendUrl}/account/orders?payment=success`,
    cancel_url: `${frontendUrl}/cart?payment=cancelled`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: {
      details: String(shippingAddress.details || ''),
      phone: String(shippingAddress.phone || ''),
      city: String(shippingAddress.city || ''),
      postalCode: String(shippingAddress.postalCode || ''),
    },
  });

  res.status(200).json({ status: 'success', session });
});

const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const oderPrice = session.amount_total / 100;

  const cart = await Cart.findById(cartId);
  const user = await User.findOne({ email: session.customer_email });
  if (!cart || !user) return;

  // 3) Create order with default paymentMethodType card
  await Order.create({
    user: user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    taxPrice: TAX_PRICE,
    shippingPrice: SHIPPING_PRICE,
    totalOrderPrice: oderPrice,
    isPaid: true,
    paidAt: Date.now(),
    paymentMethodType: 'card',
  });

  // 4) After creating order, decrement product quantity, increment product sold
  await updateStockAndClearCart(cart);
};

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Protected/User
exports.webhookCheckout = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    //  Create order
    await createCardOrder(event.data.object);
  }

  res.status(200).json({ received: true });
});
