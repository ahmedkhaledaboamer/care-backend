const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const SubCategory = require("../models/subCategoryModels");
 const factory = require("./handlersFactory");

exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.categoryId;

  next();
};

exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};
exports.getSubCaterories = factory.getAll(SubCategory);
exports.createSubCategory = factory.createOne(SubCategory);
exports.getSubCategory = factory.getOne(SubCategory);

exports.updateSubCategory = factory.updateOne(SubCategory);

exports.deleteSubCategory = factory.deleteOne(SubCategory);
