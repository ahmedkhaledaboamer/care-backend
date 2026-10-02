const express = require("express");
const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/productValidator");
const {
  getProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  resizeProductImages,
  parseProductBody,
} = require("../services/productServer");
const authServices = require("../services/authServices");
const reviewsRoute = require('./reviewRoute');

const router = express.Router();
// POST   /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews
// GET    /products/jkshjhsdjh2332n/reviews/87487sfww3
router.use('/:productId/reviews', reviewsRoute);
// routes
router
  .route("/")
  .get(getProducts)
  .post(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    uploadProductImage,
    parseProductBody,
    resizeProductImages,
    createProductValidator,
    createProduct
  );
router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    uploadProductImage,
    parseProductBody,
    resizeProductImages,
    updateProductValidator,
    updateProduct
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteProductValidator,
    deleteProduct
  );
module.exports = router;
