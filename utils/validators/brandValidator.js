const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleWare = require("../../middleWares/validatorMiddleWare");

const setSlug = (val, { req }) => {
  req.body.slug = slugify(val, { lower: true });
  return true;
};

exports.getBrandValidator = [
  check("id").isMongoId().withMessage("invalied Brand id"),
  validatorMiddleWare,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand required")
    .isLength({ min: 3 })
    .withMessage("Too short brand name")
    .isLength({ max: 32 })
    .withMessage("Too long brand name")
    .custom(setSlug),
  check("nameAr").optional().isLength({ max: 32 }).withMessage("Too long brand name"),
  validatorMiddleWare,
];

exports.updateBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand id format"),
  body("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short brand name")
    .isLength({ max: 32 })
    .withMessage("Too long brand name")
    .custom(setSlug),
  body("nameAr").optional().isLength({ max: 32 }).withMessage("Too long brand name"),
  validatorMiddleWare,
];

exports.deleteBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleWare,
];
