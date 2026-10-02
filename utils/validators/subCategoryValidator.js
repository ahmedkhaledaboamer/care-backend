const { check, body } = require("express-validator");
const slugify = require("slugify");
const validatorMiddleWare = require("../../middleWares/validatorMiddleWare");
const Category = require("../../models/categoryModels");

const setSlug = (val, { req }) => {
  req.body.slug = slugify(val, { lower: true });
  return true;
};

const categoryExists = (categoryId) =>
  Category.findById(categoryId).then((category) => {
    if (!category) return Promise.reject(new Error(`No category for this id: ${categoryId}`));
  });

exports.getSubCategoryValidator = [
  check("id").isMongoId().withMessage("invalied SubCategory id"),
  validatorMiddleWare,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("SubCategory required")
    .isLength({ min: 2 })
    .withMessage("Too short SubCategory name")
    .isLength({ max: 32 })
    .withMessage("Too long SubCategory name")
    .custom(setSlug),
  check("nameAr").optional().isLength({ max: 32 }).withMessage("Too long SubCategory name"),
  check("category")
    .notEmpty()
    .withMessage("subCategory must be belong to category")
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom(categoryExists),
  validatorMiddleWare,
];

exports.updateSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid SubCategory id format"),
  body("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Too short SubCategory name")
    .isLength({ max: 32 })
    .withMessage("Too long SubCategory name")
    .custom(setSlug),
  body("nameAr").optional().isLength({ max: 32 }).withMessage("Too long SubCategory name"),
  body("category").optional().isMongoId().withMessage("Invalid category id format").custom(categoryExists),
  validatorMiddleWare,
];

exports.deleteSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid SubCategory id format"),
  validatorMiddleWare,
];
