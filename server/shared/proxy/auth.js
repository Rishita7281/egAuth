const payloadMatchesRole = (payload, role) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  switch (role) {
    case 'admin':
      return payload.role === 'admin' && typeof payload.id === 'string' && payload.id.length > 0;
    case 'user':
      return payload.role === 'user' && typeof payload.id === 'string' && payload.id.length > 0;
    case 'department':
      return typeof payload.EmpDeptID === 'string' && payload.EmpDeptID.length > 0;
    case 'employee':
      return typeof payload.EmpID === 'string' && payload.EmpID.length > 0;
    default:
      return false;
  }
};

const getInternalProxySecret = () => process.env.PROXY_INTERNAL_SECRET || process.env.JWT_ADMIN_SECRET;

const hasTrustedProxySecret = (secret) => {
  const expectedSecret = getInternalProxySecret();
  return Boolean(expectedSecret) && secret === expectedSecret;
};

const encodeProxyUser = (payload) => Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

const decodeProxyUser = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
};

const readProxyUser = (headers, role) => {
  const secret = headers['x-egauth-proxy-secret'];
  if (!hasTrustedProxySecret(secret)) {
    const error = new Error('Requests must go through the proxy server.');
    error.status = 403;
    throw error;
  }

  const payload = decodeProxyUser(headers['x-egauth-user']);
  if (!payload) {
    const error = new Error('Missing authenticated proxy user.');
    error.status = 401;
    throw error;
  }

  if (!payloadMatchesRole(payload, role)) {
    const error = new Error('Invalid proxy authentication context.');
    error.status = 403;
    throw error;
  }

  return payload;
};

module.exports = {
  encodeProxyUser,
  getInternalProxySecret,
  hasTrustedProxySecret,
  payloadMatchesRole,
  readProxyUser,
};
