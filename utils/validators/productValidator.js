const slugify = require("slugify");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middleWares/validatorMiddleWare");
const Category = require("../../models/categoryModels");
const SubCategory = require("../../models/subCategoryModels");
const Brand = require("../../models/brandModels");

const setSlug = (val, { req }) => {
  req.body.slug = slugify(val, { lower: true });
  return true;
};

const categoryExists = (categoryId) =>
  Category.findById(categoryId).then((category) => {
    if (!category) {
      return Promise.reject(new Error(`No category for this id: ${categoryId}`));
    }
  });

const brandExists = (brandId) =>
  !brandId
    ? true
    : Brand.findById(brandId).then((brand) => {
        if (!brand) return Promise.reject(new Error(`No brand for this id: ${brandId}`));
      });

// every subcategory must exist and belong to the product category
const subcategoriesValid = async (ids, { req }) => {
  if (!ids || ids.length === 0) return true;
  let { category } = req.body;
  if (!category && req.params.id) {
    const Product = require("../../models/productsModels"); // eslint-disable-line global-require
    const product = await Product.findById(req.params.id).select("category");
    category = product && product.category && product.category._id;
  }
  const subs = await SubCategory.find({ _id: { $in: ids } });
  if (subs.length !== ids.length) throw new Error("Invalid subcategories Ids");
  if (category && subs.some((s) => s.category.toString() !== category.toString())) {
    throw new Error("subcategories not belong to category");
  }
  return true;
};

const priceAfterDiscountValid = (value, { req }) => {
  if (value === null || value === undefined || value === "") return true;
  if (req.body.price !== undefined && Number(req.body.price) <= Number(value)) {
    throw new Error("priceAfterDiscount must be lower than price");
  }
  return true;
};

exports.createProductValidator = [
  check("title")
    .notEmpty()
    .withMessage("Product required")
    .isLength({ min: 3 })
    .withMessage("must be at least 3 chars")
    .custom(setSlug),
  check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 20 })
    .withMessage("Too short product description")
    .isLength({ max: 2000 })
    .withMessage("Too long description"),
  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isInt({ min: 0 })
    .withMessage("Product quantity must be a positive number"),
  check("sold").optional().isInt({ min: 0 }).withMessage("Product sold must be a number"),
  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isFloat({ min: 0, max: 200000 })
    .withMessage("Product price must be a number"),
  check("priceAfterDiscount")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Product priceAfterDiscount must be a number")
    .custom(priceAfterDiscountValid),
  check("colors").optional().isArray().withMessage("colors should be array of string"),
  check("imageCover").notEmpty().withMessage("Product imageCover is required"),
  check("images").optional().isArray().withMessage("images should be array of string"),
  check("category")
    .notEmpty()
    .withMessage("Product must be belong to a category")
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(categoryExists),
  check("subcategories").optional().isArray().withMessage("subcategories should be array of ids"),
  check("subcategories.*").isMongoId().withMessage("Invalid ID formate"),
  check("subcategories").optional().custom(subcategoriesValid),
  check("brand").optional({ nullable: true }).isMongoId().withMessage("Invalid ID formate").custom(brandExists),
  check("ratingsAverage")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
  check("ratingsQuantity").optional().isInt({ min: 0 }).withMessage("ratingsQuantity must be a number"),

  validatorMiddleware,
];

exports.getProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),
  body("title").optional().isLength({ min: 3 }).withMessage("must be at least 3 chars").custom(setSlug),
  body("description")
    .optional()
    .isLength({ min: 20 })
    .withMessage("Too short product description")
    .isLength({ max: 2000 })
    .withMessage("Too long description"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Product quantity must be a positive number"),
  body("price").optional().isFloat({ min: 0, max: 200000 }).withMessage("Product price must be a number"),
  body("priceAfterDiscount")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Product priceAfterDiscount must be a number")
    .custom(priceAfterDiscountValid),
  body("category").optional().isMongoId().withMessage("Invalid ID formate").custom(categoryExists),
  body("subcategories").optional().isArray().withMessage("subcategories should be array of ids"),
  body("subcategories.*").isMongoId().withMessage("Invalid ID formate"),
  body("subcategories").optional().custom(subcategoriesValid),
  body("brand").optional({ nullable: true }).isMongoId().withMessage("Invalid ID formate").custom(brandExists),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check("id").isMongoId().withMessage("Invalid ID formate"),
  validatorMiddleware,
];
