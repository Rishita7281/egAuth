const mongoose = require('mongoose');

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const DATABASE_ERROR_PATTERNS = [
  /authentication failed/i,
  /buffering timed out/i,
  /client must be connected/i,
  /connection .* closed/i,
  /econnrefused/i,
  /enotfound/i,
  /failed to connect/i,
  /server selection timed out/i,
  /topology is closed/i,
];

const DATABASE_ERROR_NAMES = new Set([
  'MongooseServerSelectionError',
  'MongoNetworkError',
  'MongoNotConnectedError',
  'MongoServerSelectionError',
  'MongoTopologyClosedError',
]);

const getDatabaseReadyState = () => mongoose.connection.readyState;

const getDatabaseStatus = () => READY_STATE_LABELS[getDatabaseReadyState()] || 'unknown';

const isDatabaseReady = () => getDatabaseReadyState() === 1;

const isDatabaseConnectivityError = (error) => {
  if (!error) return false;

  if (DATABASE_ERROR_NAMES.has(error.name)) {
    return true;
  }

  const message = typeof error.message === 'string' ? error.message : '';
  return DATABASE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

module.exports = {
  getDatabaseReadyState,
  getDatabaseStatus,
  isDatabaseConnectivityError,
  isDatabaseReady,
};
