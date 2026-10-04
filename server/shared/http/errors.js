const { getDatabaseStatus, isDatabaseConnectivityError } = require('../database/state');

const createHttpError = (status, message, details) => {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
};

const normalizeError = (error) => {
  if (error?.status) {
    return error;
  }

  if (error?.type === 'entity.parse.failed') {
    return createHttpError(400, 'Invalid JSON payload');
  }

  if (error?.type === 'entity.too.large') {
    return createHttpError(413, 'Uploaded image is too large. Use an image smaller than 5 MB.');
  }

  if (isDatabaseConnectivityError(error)) {
    return createHttpError(503, `Database unavailable. Current state: ${getDatabaseStatus()}.`);
  }

  return createHttpError(500, 'Internal Server Error');
};

const errorHandler = (error, req, res, next) => {
  const normalized = normalizeError(error);
  const body = { error: normalized.message };

  if (Array.isArray(normalized.details) && normalized.details.length) {
    body.details = normalized.details;
  }

  return res.status(normalized.status || 500).json(body);
};

const sendErrorResponse = (res, error) => {
  const normalized = normalizeError(error);
  const body = { error: normalized.message };

  if (Array.isArray(normalized.details) && normalized.details.length) {
    body.details = normalized.details;
  }

  return res.status(normalized.status || 500).json(body);
};

module.exports = {
  createHttpError,
  errorHandler,
  normalizeError,
  sendErrorResponse,
};
