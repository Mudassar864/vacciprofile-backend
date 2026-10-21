const isProduction = () => process.env.NODE_ENV === 'production';

class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}

/**
 * Map any thrown error to an HTTP status + client-safe payload.
 * Mongoose validation / cast errors and duplicate keys are client errors, not 500s.
 */
function describeError(error) {
  if (!error) return { status: 500, body: { success: false, message: 'Server error' } };

  if (error instanceof HttpError || (error.statusCode && error.statusCode < 500)) {
    const body = { success: false, message: error.message };
    if (error.details) body.errors = error.details;
    return { status: error.statusCode, body };
  }

  if (error.name === 'ValidationError' && error.errors) {
    const errors = Object.values(error.errors).map((e) => ({ field: e.path, msg: e.message }));
    return {
      status: 400,
      body: { success: false, message: errors.map((e) => e.msg).join('; ') || 'Validation error', errors },
    };
  }

  if (error.name === 'CastError') {
    return { status: 400, body: { success: false, message: `Invalid value for ${error.path}` } };
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyValue || error.keyPattern || {});
    const label = fields.length ? fields.join(', ') : 'value';
    return {
      status: 409,
      body: { success: false, message: `A record with this ${label} already exists` },
    };
  }

  if (error.type === 'entity.parse.failed') {
    return { status: 400, body: { success: false, message: 'Malformed JSON body' } };
  }

  if (error.type === 'entity.too.large') {
    return { status: 413, body: { success: false, message: 'Request body too large' } };
  }

  if (error.name === 'MulterError') {
    const message =
      error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : error.message;
    return { status: 400, body: { success: false, message } };
  }

  const status = error.statusCode || error.status || 500;
  const body = { success: false, message: 'Server error' };
  if (!isProduction()) body.error = error.message;
  return { status, body };
}

/** Send an error response from a controller catch block. */
function handleError(res, error) {
  const { status, body } = describeError(error);
  if (status >= 500) {
    console.error('[error]', error);
  }
  if (res.headersSent) return;
  res.status(status).json(body);
}

/** Express error-handling middleware (registered last in server.js). */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  handleError(res, err);
}

module.exports = { HttpError, describeError, handleError, errorMiddleware };
