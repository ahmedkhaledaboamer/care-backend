const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleWare = require("../../middleWares/validatorMiddleWare");

const setSlug = (val, { req }) => {
  req.body.slug = slugify(val, { lower: true });
  return true;
};

exports.getCategoryValidator = [
  check("id").isMongoId().withMessage("invalied category id"),
  validatorMiddleWare,
];

exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Category required")
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .isLength({ max: 32 })
    .withMessage("Too long category name")
    .custom(setSlug),
  check("nameAr").optional().isLength({ max: 32 }).withMessage("Too long category name"),
  validatorMiddleWare,
];

exports.updateCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  body("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short category name")
    .isLength({ max: 32 })
    .withMessage("Too long category name")
    .custom(setSlug),
  body("nameAr").optional().isLength({ max: 32 }).withMessage("Too long category name"),
  validatorMiddleWare,
];

exports.deleteCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  validatorMiddleWare,
];
