const TOKEN_KEYS = {
  admin: 'adminToken',
  department: 'deptToken',
  employee: 'empToken',
  user: 'userToken',
};

const ROLE_PRECEDENCE = ['admin', 'department', 'employee', 'user'];

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${'='.repeat(padding)}`;
  if (typeof atob !== 'function') {
    return null;
  }
  return atob(padded);
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(parts[1]);
    if (!decoded) return null;
    return JSON.parse(decoded);
  } catch (err) {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return false;
  }
  return Date.now() >= payload.exp * 1000;
}

function payloadMatchesRole(payload, role) {
  if (!payload) return false;

  switch (role) {
    case 'admin':
      return payload.role === 'admin' && Boolean(payload.id);
    case 'user':
      return payload.role === 'user' && Boolean(payload.id);
    case 'department':
      return Boolean(payload.EmpDeptID);
    case 'employee':
      return Boolean(payload.EmpID);
    default:
      return false;
  }
}

export function isTokenValidForRole(token, role) {
  const payload = decodeJwtPayload(token);
  if (!payloadMatchesRole(payload, role)) {
    return false;
  }
  return !isTokenExpired(token);
}

export function getTokenForRole(role) {
  if (typeof window === 'undefined') {
    return '';
  }
  const key = TOKEN_KEYS[role];
  return key ? localStorage.getItem(key) || '' : '';
}

export function getSessionForRole(role) {
  const token = getTokenForRole(role);
  if (!token || !isTokenValidForRole(token, role)) {
    return null;
  }
  return decodeJwtPayload(token);
}

export function setTokenForRole(role, token) {
  const key = TOKEN_KEYS[role];
  if (!key || typeof window === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem(key, token);
  } else {
    localStorage.removeItem(key);
  }
}

export function clearTokenForRole(role) {
  const key = TOKEN_KEYS[role];
  if (!key || typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(key);
}

export function clearAllTokens() {
  if (typeof window === 'undefined') {
    return;
  }
  Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getActiveRoles() {
  return ROLE_PRECEDENCE.filter((role) => {
    const token = getTokenForRole(role);
    return token && isTokenValidForRole(token, role);
  });
}

export function getPrimaryRole() {
  const active = getActiveRoles();
  return active[0] || null;
}
