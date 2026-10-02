const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleWares/validatorMiddleWare');

exports.createCouponValidator = [
  body('name').trim().notEmpty().withMessage('Coupon name required').customSanitizer((v) => String(v).toUpperCase()),
  body('expire').notEmpty().withMessage('Coupon expire time required').isISO8601().withMessage('Invalid expire date'),
  body('discount')
    .notEmpty()
    .withMessage('Coupon discount value required')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),
  validatorMiddleware,
];

exports.updateCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon id format'),
  body('name').optional().trim().notEmpty().withMessage('Coupon name required').customSanitizer((v) => String(v).toUpperCase()),
  body('expire').optional().isISO8601().withMessage('Invalid expire date'),
  body('discount').optional().isFloat({ min: 1, max: 100 }).withMessage('Discount must be between 1 and 100'),
  validatorMiddleware,
];

exports.couponIdValidator = [check('id').isMongoId().withMessage('Invalid coupon id format'), validatorMiddleware];
