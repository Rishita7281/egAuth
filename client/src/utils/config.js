const fromEnv = (key, fallback) => {
  const value = process.env[key];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const isBrowser = typeof window !== 'undefined';
const hostName = isBrowser ? window.location.hostname : '';
const isLocalHost = hostName === 'localhost' || hostName === '127.0.0.1';

const defaultOrigin = isBrowser && window.location.origin && !isLocalHost
  ? window.location.origin
  : 'http://localhost:7000';

const defaultWsOrigin = defaultOrigin.replace(/^http/i, 'ws');

export const MAIN_API = fromEnv('REACT_APP_MAIN_API', `${defaultOrigin}/api`);
export const SECONDARY_API = fromEnv('REACT_APP_SECONDARY_API', `${defaultOrigin}/verify`);
export const WS_URL = fromEnv('REACT_APP_WS_URL', `${defaultWsOrigin}/qr`);
