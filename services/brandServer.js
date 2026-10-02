// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require("sharp");
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const { uploadSingleImage } = require("../middleWares/uploadImageMiddleWares");
const brandModel = require("../models/brandModels");
const factory = require("./handlersFactory");

exports.uploadBrandImage = uploadSingleImage("image");

// image is optional — keep the current one when no file is sent
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    delete req.body.image;
    return next();
  }
  const fileName = `brands-${uuidv4()}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(600, 600, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: "#ffffff" })
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/brands/${fileName}`);
  req.body.image = fileName;
  next();
});

exports.getBrands = factory.getAll(brandModel);

exports.getBrand = factory.getOne(brandModel);

exports.createBrand = factory.createOne(brandModel);

exports.updateBrand = factory.updateOne(brandModel);

exports.deleteBrand = factory.deleteOne(brandModel);
