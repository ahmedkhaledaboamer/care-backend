const express = require("express");
const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validators/categoryValidator");
const {
  getCaterories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} = require("../services/categoryServer");
const authServices = require("../services/authServices");
const subcategoryroutr = require("./subCategoryRoute");

const router = express.Router();

// routes
router.use("/:categoryId/subcategory", subcategoryroutr);
router.route("/").get(getCaterories).post(
  authServices.protect,
  authServices.allowedTo("admin", "manager"), 

  uploadCategoryImage,
  resizeImage,
  createCategoryValidator,
  createCategory
);
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteCategoryValidator,
    deleteCategory
  );
module.exports = router;
