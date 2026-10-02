const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

exports.deleteOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await model.findById(id);
    if (!document) {
      return next(new ApiError(`no document for this ${id}`, 404));
    }
    // document.remove() triggers 'remove' middleware (e.g. review ratings)
    await document.remove();

    res.status(204).send();
  });

exports.updateOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new ApiError("no document for this id", 404));
    }
    res.status(200).json({ data: document });
  });

exports.createOne = (model) =>
  asyncHandler(async (req, res) => {
    const document = await model.create(req.body);
    res.status(201).json({ data: document });
  });

exports.getOne = (model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // 1) Build query
    let query = model.findById(id);
    if (populationOpt) {
      query = query.populate(populationOpt);
    }

    // 2) Execute query
    const document = await query;
    if (!document) {
      return next(new ApiError("no document for this id", 404));
    }
    res.status(200).json({ data: document });
  });

exports.getAll = (Model, modelName = '') =>
  asyncHandler(async (req, res) => {
    const filter = req.filterObj || {};
    const apiFeature = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search(modelName)
      .sort()
      .limitFields();

    // count with the same filters so numberOfPage / next are correct
    const documentCounts = await Model.countDocuments(apiFeature.mongooseQuery.getFilter());
    apiFeature.paginate(documentCounts);

    // execute  query
    const { mongooseQuery, pagination } = apiFeature;
    const document = await mongooseQuery;
    res.status(200).json({ results: document.length, pagination, data: document });
  });
