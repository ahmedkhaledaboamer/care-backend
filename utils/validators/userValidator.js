const slugify = require('slugify');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middleWares/validatorMiddleWare');
const User = require('../../models/userModels');

// email must be unique — except for the user being updated (`ownerId`)
const emailAvailable = (getOwnerId) => (val, { req }) =>
  User.findOne({ email: String(val).toLowerCase() }).then((user) => {
    const ownerId = getOwnerId(req);
    if (user && (!ownerId || user._id.toString() !== ownerId.toString())) {
      return Promise.reject(new Error('E-mail already in use'));
    }
  });

const setSlug = (val, { req }) => {
  req.body.slug = slugify(val, { lower: true });
  return true;
};

const phoneCheck = () =>
  check('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone(['ar-AE', 'ar-EG', 'ar-SA'])
    .withMessage('Invalid phone number only accepted UAE, Egy and SA Phone numbers');

exports.createUserValidator = [
  check('name').notEmpty().withMessage('User required').isLength({ min: 3 }).withMessage('Too short User name').custom(setSlug),

  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom(emailAvailable(() => null)),

  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),

  check('passwordConfirm').notEmpty().withMessage('Password confirmation required'),

  phoneCheck(),
  check('profileImg').optional(),
  check('role').optional().isIn(['user', 'manager', 'admin']).withMessage('Invalid role'),

  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  body('name').optional().isLength({ min: 3 }).withMessage('Too short User name').custom(setSlug),
  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .custom(emailAvailable((req) => req.params.id)),
  phoneCheck(),
  check('profileImg').optional(),
  check('role').optional().isIn(['user', 'manager', 'admin']).withMessage('Invalid role'),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  body('currentPassword').notEmpty().withMessage('You must enter your current password'),
  body('passwordConfirm').notEmpty().withMessage('You must enter the password confirm'),
  body('password')
    .notEmpty()
    .withMessage('You must enter new password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom(async (val, { req }) => {
      // 1) Verify current password
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error('There is no user for this id');
      }
      const isCorrectPassword = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isCorrectPassword) {
        throw new Error('Incorrect current password');
      }

      // 2) Verify password confirm
      if (val !== req.body.passwordConfirm) {
        throw new Error('Password Confirmation incorrect');
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId().withMessage('Invalid User id format'),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body('name').optional().isLength({ min: 3 }).withMessage('Too short User name').custom(setSlug),
  check('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .custom(emailAvailable((req) => req.user._id)),
  phoneCheck(),
  validatorMiddleware,
];

exports.changeLoggedUserPasswordValidator = [
  body('password')
    .notEmpty()
    .withMessage('You must enter new password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validatorMiddleware,
];
