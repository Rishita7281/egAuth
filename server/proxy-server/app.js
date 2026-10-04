const httpProxy = require('http-proxy');
const { PORT } = require('./config');
const { createGatewayServer } = require('./gateway');

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
  xfwd: true,
});
const server = createGatewayServer(proxy);
server.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
