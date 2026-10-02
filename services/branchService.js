const factory = require('./handlersFactory');
const Branch = require('../models/branchModel');

// Public list only shows active branches; staff (?all=true) see every branch
exports.createFilterObj = (req, res, next) => {
  if (req.query.all !== 'true') req.filterObj = { active: true };
  delete req.query.all;
  next();
};

// @desc    Get list of branches
// @route   GET /api/v1/branches
// @access  Public
exports.getBranches = factory.getAll(Branch, 'branches');

// @desc    Get specific branch
// @route   GET /api/v1/branches/:id
// @access  Public
exports.getBranch = factory.getOne(Branch);

// @desc    Create branch
// @route   POST /api/v1/branches
// @access  Private/Admin-Manager
exports.createBranch = factory.createOne(Branch);

// @desc    Update branch
// @route   PUT /api/v1/branches/:id
// @access  Private/Admin-Manager
exports.updateBranch = factory.updateOne(Branch);

// @desc    Delete branch
// @route   DELETE /api/v1/branches/:id
// @access  Private/Admin
exports.deleteBranch = factory.deleteOne(Branch);
