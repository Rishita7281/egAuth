const { getDatabaseStatus, isDatabaseReady } = require('../database/state');
const { createHttpError } = require('../http/errors');

const requireDatabase = (req, res, next) => {
  if (req.method === 'OPTIONS' || isDatabaseReady()) {
    return next();
  }

  return next(createHttpError(503, `Database unavailable. Current state: ${getDatabaseStatus()}.`));
};

module.exports = { requireDatabase };
