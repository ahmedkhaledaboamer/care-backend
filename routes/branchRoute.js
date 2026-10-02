const express = require('express');
const {
  getBranchValidator,
  createBranchValidator,
  updateBranchValidator,
  deleteBranchValidator,
} = require('../utils/validators/branchValidator');
const {
  createFilterObj,
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../services/branchService');
const authService = require('../services/authServices');

const router = express.Router();

router
  .route('/')
  .get(createFilterObj, getBranches)
  .post(authService.protect, authService.allowedTo('admin', 'manager'), createBranchValidator, createBranch);

router
  .route('/:id')
  .get(getBranchValidator, getBranch)
  .put(authService.protect, authService.allowedTo('admin', 'manager'), updateBranchValidator, updateBranch)
  .delete(authService.protect, authService.allowedTo('admin'), deleteBranchValidator, deleteBranch);

module.exports = router;
