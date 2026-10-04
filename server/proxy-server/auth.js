const jwt = require('jsonwebtoken');

const { encodeProxyUser, getInternalProxySecret, payloadMatchesRole } = require('../shared/proxy/auth');
const { ROLE_SECRETS } = require('./config');

const verifyBearerToken = (req, role) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { status: 401, message: 'Access denied. No token provided.' };
  }

  const secret = ROLE_SECRETS[role];
  if (!secret) {
    return { status: 500, message: `JWT secret is not configured for role: ${role}.` };
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), secret);
    if (!payloadMatchesRole(payload, role)) {
      return { status: 403, message: 'Invalid or expired token.' };
    }
    return { payload };
  } catch (error) {
    return { status: 403, message: 'Invalid or expired token.' };
  }
};

const verifyWebSocketToken = (token, role) => {
  if (!token) {
    return { status: 401, message: 'Missing token' };
  }

  const secret = ROLE_SECRETS[role];
  if (!secret) {
    return { status: 500, message: `JWT secret is not configured for role: ${role}.` };
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payloadMatchesRole(payload, role)) {
      return { status: 403, message: 'Invalid token payload' };
    }
    return { payload };
  } catch (error) {
    return { status: 403, message: 'Invalid or expired token.' };
  }
};

const attachProxyHeaders = (req, payload) => {
  req.headers['x-egauth-proxy-secret'] = getInternalProxySecret();
  if (payload) {
    req.headers['x-egauth-user'] = encodeProxyUser(payload);
  } else {
    delete req.headers['x-egauth-user'];
  }
};

module.exports = {
  attachProxyHeaders,
  verifyBearerToken,
  verifyWebSocketToken,
};
