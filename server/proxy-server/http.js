const { buildCorsHeaders } = require('./config');

const addCorsHeaders = (req, res) => {
  const headers = buildCorsHeaders(req.headers.origin);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
};

const sendJson = (req, res, status, body) => {
  addCorsHeaders(req, res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const sendSocketStatus = (socket, statusLine) => {
  socket.write(`HTTP/1.1 ${statusLine}\r\n\r\n`);
  socket.destroy();
};

module.exports = {
  addCorsHeaders,
  sendJson,
  sendSocketStatus,
};
