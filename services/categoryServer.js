// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require("sharp");
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const { uploadSingleImage } = require('../middleWares/uploadImageMiddleWares');
const Category = require("../models/categoryModels");
const factory = require("./handlersFactory");

exports.uploadCategoryImage = uploadSingleImage("image");

// image is optional on update — keep the current one when no file is sent
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    delete req.body.image;
    return next();
  }
  const fileName = `category-${uuidv4()}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/categories/${fileName}`);
  req.body.image = fileName;
  next();
});

exports.getCaterories = factory.getAll(Category);

exports.getCategory = factory.getOne(Category);

exports.createCategory = factory.createOne(Category);

exports.updateCategory = factory.updateOne(Category);

exports.deleteCategory = factory.deleteOne(Category);
