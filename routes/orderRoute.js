const express = require('express');
const {
  createCashOrder,
  findAllOrders,
  findSpecificOrder,
  filterOrderForLoggedUser,
  updateOrderToPaid,
  updateOrderToDelivered,
  checkoutSession,
} = require('../services/orderService');

const authService = require('../services/authServices');

const router = express.Router();

router.use(authService.protect);

// POST is preferred (sends the shipping address); GET kept for older clients
router
  .route('/checkout-session/:cartId')
  .get(authService.allowedTo('user'), checkoutSession)
  .post(authService.allowedTo('user'), checkoutSession);

router.route('/:cartId').post(authService.allowedTo('user'), createCashOrder);
router.get(
  '/',
  authService.allowedTo('user', 'admin', 'manager'),
  filterOrderForLoggedUser,
  findAllOrders
);
router.get('/:id', authService.allowedTo('user', 'admin', 'manager'), findSpecificOrder);

router.put(
  '/:id/pay',
  authService.allowedTo('admin', 'manager'),
  updateOrderToPaid
);
router.put(
  '/:id/deliver',
  authService.allowedTo('admin', 'manager'),
  updateOrderToDelivered
);

module.exports = router;