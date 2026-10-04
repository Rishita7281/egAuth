const http = require('http');

const { addCorsHeaders, sendJson, sendSocketStatus } = require('./http');
const { attachProxyHeaders, verifyBearerToken, verifyWebSocketToken } = require('./auth');
const { isOriginAllowed } = require('./config');
const { getRequiredRole, matchesRoute, resolveHttpRoute, resolveWebSocketRoute } = require('./routes');

const createGatewayServer = (proxy) => {
  proxy.on('error', (error, req, res) => {
    if (res && !res.headersSent) {
      sendJson(req, res, 502, { error: 'Proxy request failed', details: [error.message] });
    }
  });

  const server = http.createServer((req, res) => {
    if (!isOriginAllowed(req.headers.origin)) {
      sendJson(req, res, 403, { error: 'Origin not allowed' });
      return;
    }

    addCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/health') {
      sendJson(req, res, 200, { status: 'ok', proxy: true });
      return;
    }

    const route = resolveHttpRoute(req.url);
    if (!route) {
      sendJson(req, res, 404, { error: 'Proxy route not found' });
      return;
    }

    const requestUrl = new URL(route.upstreamPath, 'http://localhost');
    const isPublic = route.publicRoutes.some((entry) => matchesRoute(req.method, requestUrl.pathname, entry));
    const requiredRole = isPublic ? null : getRequiredRole(requestUrl.pathname, route.roleRules);

    if (!isPublic && !requiredRole) {
      sendJson(req, res, 404, { error: 'Proxy route not found' });
      return;
    }

    let payload = null;
    if (requiredRole) {
      const verification = verifyBearerToken(req, requiredRole);
      if (!verification.payload) {
        sendJson(req, res, verification.status, { error: verification.message });
        return;
      }
      payload = verification.payload;
    }

    attachProxyHeaders(req, payload);
    req.url = route.upstreamPath;
    proxy.web(req, res, { target: route.target });
  });

  server.on('upgrade', (req, socket, head) => {
    if (!isOriginAllowed(req.headers.origin)) {
      sendSocketStatus(socket, '403 Forbidden');
      return;
    }

    const route = resolveWebSocketRoute(req.url);
    if (!route) {
      sendSocketStatus(socket, '404 Not Found');
      return;
    }

    const verification = verifyWebSocketToken(route.token, route.role);
    if (!verification.payload) {
      const statusLine = verification.status === 401 ? '401 Unauthorized' : verification.status === 403 ? '403 Forbidden' : '500 Internal Server Error';
      sendSocketStatus(socket, statusLine);
      return;
    }

    attachProxyHeaders(req, verification.payload);
    req.url = route.upstreamPath;
    proxy.ws(req, socket, head, { target: route.target });
  });

  return server;
};

module.exports = {
  createGatewayServer,
};
