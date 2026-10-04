const { hasTrustedProxySecret } = require('../proxy/auth');

const requireTrustedProxy = (req, res, next) => {
  if (hasTrustedProxySecret(req.header('x-egauth-proxy-secret'))) {
    return next();
  }

  return res.status(403).json({ error: 'Requests must go through the proxy server.' });
};

module.exports = { requireTrustedProxy };
