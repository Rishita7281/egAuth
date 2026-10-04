const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const normalizeOrigin = (origin) => {
  if (typeof origin !== 'string') return '';
  return origin.trim().replace(/\/+$/, '');
};

const parseCsv = (value, fallback) => {
  const source = typeof value === 'string' && value.trim() ? value : fallback;
  return source
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const allowedOrigins = parseCsv(process.env.CORS_ALLOWED_ORIGINS, 'http://localhost:3000').map(normalizeOrigin);
const DEFAULT_MAIN_PORT = Number(process.env.MAIN_SERVER_PORT || process.env.PORT) || 8000;
const DEFAULT_SECONDARY_PORT = Number(process.env.SECONDARY_SERVER_PORT || process.env.PORT) || 9000;

const TARGETS = {
  main: process.env.TARGET_MAIN_URL || `http://localhost:${DEFAULT_MAIN_PORT}`,
  secondary: process.env.TARGET_SECONDARY_URL || `http://localhost:${DEFAULT_SECONDARY_PORT}`,
};

const PREFIXES = {
  main: '/api',
  secondary: '/verify',
  websocket: '/qr',
};

const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const ROLE_SECRETS = {
  admin: process.env.JWT_ADMIN_SECRET,
  user: process.env.JWT_USER_SECRET,
  department: process.env.JWT_DEPT_SECRET,
  employee: process.env.JWT_EMP_SECRET,
};

const PORT = Number(process.env.PROXY_SERVER_PORT || process.env.PORT) || 7000;

const allowsAnyOrigin = allowedOrigins.includes('*');

const resolveAllowedOrigin = (origin) => {
  if (allowsAnyOrigin) {
    return '*';
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return null;
  }

  return allowedOrigins.includes(normalizedOrigin) ? origin : null;
};

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  return resolveAllowedOrigin(origin) !== null;
};

const buildCorsHeaders = (origin) => {
  const headers = { ...BASE_CORS_HEADERS };
  const allowedOrigin = resolveAllowedOrigin(origin);

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  if (!allowsAnyOrigin) {
    headers.Vary = 'Origin';
  }

  return headers;
};

module.exports = {
  BASE_CORS_HEADERS,
  buildCorsHeaders,
  allowedOrigins,
  isOriginAllowed,
  PORT,
  PREFIXES,
  ROLE_SECRETS,
  TARGETS,
};
