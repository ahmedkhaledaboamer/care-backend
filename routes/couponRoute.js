const express = require('express');

const {
  getCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../services/couponService');
const {
  createCouponValidator,
  updateCouponValidator,
  couponIdValidator,
} = require('../utils/validators/couponValidator');

const authService = require('../services/authServices');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('admin', 'manager'));

router.route('/').get(getCoupons).post(createCouponValidator, createCoupon);
router
  .route('/:id')
  .get(couponIdValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(authService.allowedTo('admin'), couponIdValidator, deleteCoupon);

module.exports = router;
