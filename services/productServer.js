// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require("sharp");
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const Product = require("../models/productsModels");
const factory = require("./handlersFactory");
const { uploadMixOfImages } = require("../middleWares/uploadImageMiddleWares");
const { toFileName } = require("../utils/imageUrl");

exports.uploadProductImage = uploadMixOfImages([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

const saveImage = (buffer, fileName) =>
  sharp(buffer)
    .resize(1000, 1000, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: "#ffffff" })
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`uploads/products/${fileName}`);

// Accepts JSON-encoded or repeated multipart fields, e.g. colors, subcategories, benefits
const parseList = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && /^\s*[[{]/.test(value)) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [value];
    }
  }
  return [value];
};

exports.parseProductBody = (req, res, next) => {
  ["colors", "subcategories", "benefits", "ingredients", "sizes"].forEach((field) => {
    if (field in req.body) {
      const list = parseList(req.body[field]);
      req.body[field] = list === undefined ? [] : list;
    }
  });
  if (typeof req.body.directions === "string") {
    try {
      req.body.directions = JSON.parse(req.body.directions);
    } catch (e) {
      req.body.directions = { en: req.body.directions };
    }
  }
  if (req.body.brand === "") req.body.brand = null;
  if (req.body.priceAfterDiscount === "") req.body.priceAfterDiscount = null;
  next();
};

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  const files = req.files || {};

  // image processing for image cover
  if (files.imageCover) {
    const imageCoverFileName = `products-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await saveImage(files.imageCover[0].buffer, imageCoverFileName);
    req.body.imageCover = imageCoverFileName;
  } else if (req.body.imageCover) {
    req.body.imageCover = toFileName(req.body.imageCover);
  }

  // existing images the client wants to keep (URLs or file names)
  const kept = (parseList(req.body.images) || []).filter((v) => typeof v === "string").map(toFileName);

  // image processing for images
  if (files.images) {
    const uploaded = await Promise.all(
      files.images.map(async (img, index) => {
        const imageName = `products-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await saveImage(img.buffer, imageName);
        return imageName;
      })
    );
    req.body.images = [...kept, ...uploaded];
  } else if ("images" in req.body) {
    req.body.images = kept;
  }
  next();
});

exports.getProducts = factory.getAll(Product, 'products');

exports.getProduct = factory.getOne(Product, "reviews");

exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);

exports.deleteProduct = factory.deleteOne(Product);
