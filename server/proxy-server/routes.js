const { PREFIXES, TARGETS } = require('./config');

const MAIN_PUBLIC_ROUTES = [
  { method: 'POST', path: '/login/userLogin' },
  { method: 'POST', path: '/login/userGuest' },
  { method: 'POST', path: '/login/empLogin' },
  { method: 'POST', path: '/login/empGuest' },
  { method: 'POST', path: '/login/deptLogin' },
  { method: 'POST', path: '/login/deptGuest' },
  { method: 'POST', path: '/register/userRegister' },
  { method: 'POST', path: '/register/deptRegister' },
  { method: 'GET', prefix: '/docs' },
  { method: 'GET', path: '/health' },
];

const SECONDARY_PUBLIC_ROUTES = [
  { method: 'GET', path: '/health' },
];

const MAIN_ROLE_RULES = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/dept', role: 'department' },
  { prefix: '/user', role: 'user' },
  { prefix: '/emp', role: 'employee' },
];

const SECONDARY_ROLE_RULES = [
  { prefix: '/emp', role: 'employee' },
  { prefix: '/user', role: 'user' },
];

const stripPrefix = (url, prefix) => {
  if (url === prefix) return '/';
  return url.startsWith(prefix) ? url.slice(prefix.length) || '/' : url;
};

const matchesRoute = (method, pathName, route) => {
  if (route.method !== method) {
    return false;
  }

  if (route.path) {
    return route.path === pathName;
  }

  if (route.prefix) {
    return pathName === route.prefix || pathName.startsWith(`${route.prefix}/`);
  }

  return false;
};

const getRequiredRole = (pathName, rules) => {
  const match = rules.find((rule) => pathName === rule.prefix || pathName.startsWith(`${rule.prefix}/`));
  return match?.role || null;
};

const resolveHttpRoute = (url) => {
  if (url.startsWith(PREFIXES.main)) {
    return {
      target: TARGETS.main,
      publicRoutes: MAIN_PUBLIC_ROUTES,
      roleRules: MAIN_ROLE_RULES,
      upstreamPath: stripPrefix(url, PREFIXES.main),
    };
  }

  if (url.startsWith(PREFIXES.secondary)) {
    return {
      target: TARGETS.secondary,
      publicRoutes: SECONDARY_PUBLIC_ROUTES,
      roleRules: SECONDARY_ROLE_RULES,
      upstreamPath: stripPrefix(url, PREFIXES.secondary),
    };
  }

  return null;
};

const resolveWebSocketRoute = (url) => {
  const requestUrl = new URL(url, 'http://localhost');
  if (requestUrl.pathname !== PREFIXES.websocket) {
    return null;
  }

  return {
    target: TARGETS.secondary,
    upstreamPath: PREFIXES.websocket + requestUrl.search,
    role: 'employee',
    token: requestUrl.searchParams.get('token') || '',
  };
};

module.exports = {
  getRequiredRole,
  matchesRoute,
  resolveHttpRoute,
  resolveWebSocketRoute,
};
