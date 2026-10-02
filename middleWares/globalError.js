const ApiError = require("../utils/apiError");

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorForProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
const handleJwtInvalidSignature = () =>
  new ApiError('Invalid token, please login again..', 401);

const handleJwtExpired = () =>
  new ApiError('Expired token, please login again..', 401);

// Turns known library errors into clear 4xx errors (in every environment)
const normalizeError = (err) => {
  if (err.name === 'JsonWebTokenError') return handleJwtInvalidSignature();
  if (err.name === 'TokenExpiredError') return handleJwtExpired();
  if (err.name === 'CastError') return new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(`This ${field} already exists`, 400);
  }
  if (err.name === 'ValidationError') {
    return new ApiError(Object.values(err.errors).map((e) => e.message).join(', '), 400);
  }
  if (err.name === 'MulterError') return new ApiError(err.message, 400);
  return err;
};

// eslint-disable-next-line no-unused-vars
const globalError = (error, req, res, next) => {
  const err = normalizeError(error);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    sendErrorForProd(err, res);
  }
};

module.exports = globalError;
