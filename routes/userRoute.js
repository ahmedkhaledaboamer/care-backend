const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserValidator,
  changeLoggedUserPasswordValidator,
} = require("../utils/validators/userValidator");
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData

} = require("../services/userServices");
const authServices = require("../services/authServices");

const router = express.Router();

// routes
router.use(authServices.protect);

router.get("/getMe", getLoggedUserData, getUser);
router.put('/changeMyPassword', changeLoggedUserPasswordValidator, updateLoggedUserPassword);
router.put('/updateMe', updateLoggedUserValidator, updateLoggedUserData);
router.delete('/deleteMe', deleteLoggedUserData);

// Admin
router.use(authServices.allowedTo("admin", "manager"));
router
  .route("/")
  .get(getUsers)
  .post(uploadUserImage, resizeImage, createUserValidator, createUser);
router
  .route("/:id")
  .get(  getUserValidator, getUser)
  .put(uploadUserImage, resizeImage, updateUserValidator, updateUser)
  .delete(authServices.allowedTo("admin"), deleteUserValidator, deleteUser);
router.put(
  "/changeMyPassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

module.exports = router;
