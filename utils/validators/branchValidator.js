const { check, body } = require("express-validator");
const validatorMiddleWare = require("../../middleWares/validatorMiddleWare");

const idCheck = [check("id").isMongoId().withMessage("Invalid branch id format"), validatorMiddleWare];

exports.getBranchValidator = idCheck;
exports.deleteBranchValidator = idCheck;

exports.createBranchValidator = [
  body("name").notEmpty().withMessage("Branch name required").isLength({ max: 60 }).withMessage("Too long branch name"),
  body("city").notEmpty().withMessage("Branch city required"),
  body("address").notEmpty().withMessage("Branch address required"),
  body("location.lat").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  body("location.lng").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  body("phone").optional({ checkFalsy: true }).isLength({ min: 5, max: 20 }).withMessage("Invalid phone number"),
  validatorMiddleWare,
];

exports.updateBranchValidator = [
  check("id").isMongoId().withMessage("Invalid branch id format"),
  body("name").optional().notEmpty().withMessage("Branch name required").isLength({ max: 60 }).withMessage("Too long branch name"),
  body("location.lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  body("location.lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  body("phone").optional({ checkFalsy: true }).isLength({ min: 5, max: 20 }).withMessage("Invalid phone number"),
  validatorMiddleWare,
];
