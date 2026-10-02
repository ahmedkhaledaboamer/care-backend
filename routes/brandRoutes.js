const express = require("express");
const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validators/brandValidator");
const {
  getBrands,
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../services/brandServer");
const authServices = require("../services/authServices");

const router = express.Router();

// routes
router
  .route("/")
  .get(getBrands)
  .post(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand
  ); 
router
  .route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    authServices.protect,
    authServices.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteBrandValidator,
    deleteBrand
  );
module.exports = router;
