const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Standardize error response structure
  const payload = {
    error: err.name || "Error",
    message: err.message || "An unexpected error occurred",
  };

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ ...payload, error: "ValidationError" });
  }

  // Mongoose cast errors (e.g., expecting Number but got string)
  if (err.name === "CastError") {
    return res.status(400).json({
      ...payload,
      error: "BadRequest",
      details: `Invalid value for '${err.path}'`,
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ ...payload, error: "DuplicateEntry", details: err.keyValue });
  }

  // Malformed JSON
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ ...payload, error: "BadRequest" });
  }

  // Allow controllers to set explicit statusCode
  const status = err.statusCode || err.status || 500;
  return res
    .status(status)
    .json({ ...payload, error: status === 500 ? "InternalServerError" : payload.error });
};

module.exports = errorHandler;