const express = require("express");

const {
  createSubCategory,
  getSubCaterories,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
  createFilterObj,
} = require("../services/subCategoryServices");
const {
  createSubCategoryValidator,
  getSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subCategoryValidator");
const authServices = require("../services/authServices");

const router = express.Router({ mergeParams: true });
router
  .route("/")
  .post(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  )
  .get(createFilterObj, getSubCaterories);
router
  .route("/:id")
  .get(getSubCategoryValidator, getSubCategory)
  .put(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin" ),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;
