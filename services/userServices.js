// eslint-disable-next-line import/no-extraneous-dependencies
const sharp = require("sharp");
// eslint-disable-next-line import/no-extraneous-dependencies
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');
const { uploadSingleImage } = require("../middleWares/uploadImageMiddleWares");

 const User = require("../models/userModels");
 const factory = require("./handlersFactory");
const ApiError = require("../utils/apiError");
const createToken = require('../utils/createToken');

exports.uploadUserImage = uploadSingleImage("profileImg");

exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `Users-${uuidv4()}-${Date.now()}.jpeg`;
  if(req.file){
    await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/users/${fileName}`);
  req.body.profileImg = fileName;
  }
 
   next();
});

exports.getUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = factory.createOne(User);

exports.updateUser = asyncHandler(async (req, res, next) => {
  const update = {};
  ['name', 'slug', 'phone', 'email', 'profileImg', 'role', 'active'].forEach((field) => {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  });
  const document = await User.findByIdAndUpdate(req.params.id, update, { new: true });

  if (!document) {
    // res.status(404).json({ msg: "no document for this id" });
    return next(new ApiError("no document for this id", 404));
  }
  res.status(200).json({ data: document });
});
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(req.params.id,{
    password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
  }, {
    new: true,
  });

  if (!document) {
    // res.status(404).json({ msg: "no document for this id" });
    return next(new ApiError("no document for this id", 404));
  }
  res.status(200).json({ data: document });
});
exports.deleteUser = factory.deleteOne(User);
   
   // @desc    Get Logged user data
// @route   GET /api/v1/users/getMe
// @access  Private/Protect

exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

   
   // @desc    Update logged user password
// @route   PUT /api/v1/users/updateMyPassword
// @access  Private/Protect
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  // 1) Update user password based user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  // 2) Generate token
  const token = createToken(user._id);

  res.status(200).json({ data: user, token });
});

// @desc    Update logged user data (without password, role)
// @route   PUT /api/v1/users/updateMe
// @access  Private/Protect
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const update = {};
  ['name', 'slug', 'email', 'phone'].forEach((field) => {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  });
  const updatedUser = await User.findByIdAndUpdate(req.user._id, update, { new: true });

  res.status(200).json({ data: updatedUser });
});



// @desc    Deactivate logged user
// @route   DELETE /api/v1/users/deleteMe
// @access  Private/Protect
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: 'Success' });
});