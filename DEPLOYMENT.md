# Production Deployment

## Architecture

Production should expose only the proxy server to browsers.

- `client`: static React app
- `proxy-server`: public API/WebSocket gateway
- `main-server`: private/internal API
- `secondary-server`: private/internal QR and WebSocket service
- `MongoDB`: database
- `LavinMQ on CloudAMQP`: key fanout transport over AMQP
- `Redis`: optional key cache and warm-start helper

## Recommended Hosting

- Host `client` on Vercel.
- Host `proxy-server`, `main-server`, and `secondary-server` on Render or Railway.
- Keep `main-server` and `secondary-server` private/internal.
- Point the browser only at the public proxy URL.

## Deploy Order

1. Provision MongoDB, a LavinMQ instance on CloudAMQP, and optional Redis.
2. Deploy `main-server`.
3. Deploy `secondary-server`.
4. Deploy `proxy-server` with internal target URLs for the two backend services.
5. Deploy `client` with public proxy URLs.

## Backend Service Setup

Use the `server` directory as the service root.

- Main server start command: `npm run start:main`
- Secondary server start command: `npm run start:secondary`
- Proxy server start command: `npm run start:proxy`

## Frontend Setup

Use the `client` directory as the project root in Vercel.

- Build command: `npm run build`
- Output directory: `build`

`client/vercel.json` rewrites all routes to `/` so React Router routes do not 404 on refresh.

## Required Environment Variables

### Shared backend secrets

- `JWT_ADMIN_SECRET`
- `JWT_USER_SECRET`
- `JWT_DEPT_SECRET`
- `JWT_EMP_SECRET`
- `PROXY_INTERNAL_SECRET`
- `RSAPUBLIC`
- `RSAPRIVATE`
- `ALGORITHM`

### Main server

- `PORT`
- `MONGODB_URI` or both `DB_USER` and `DB_PASSWORD`
- `LAVINMQ_URL`
- `REDIS_URL` (optional)
- `SWAGGER_SERVER_URL`

### Secondary server

- `PORT`
- `MONGODB_URI` or both `DB_USER` and `DB_PASSWORD`
- `LAVINMQ_URL`
- `REDIS_URL` (optional)

### Proxy server

- `PORT`
- `TARGET_MAIN_URL`
- `TARGET_SECONDARY_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_ADMIN_SECRET`
- `JWT_USER_SECRET`
- `JWT_DEPT_SECRET`
- `JWT_EMP_SECRET`
- `PROXY_INTERNAL_SECRET`

### Client

- `REACT_APP_MAIN_API`
- `REACT_APP_SECONDARY_API`
- `REACT_APP_WS_URL`

## Example Production Values

```env
# client
REACT_APP_MAIN_API=https://api.example.com/api
REACT_APP_SECONDARY_API=https://api.example.com/verify
REACT_APP_WS_URL=wss://api.example.com/qr
```

```env
# proxy-server
PORT=10000
TARGET_MAIN_URL=http://egauth-main.internal:8000
TARGET_SECONDARY_URL=http://egauth-secondary.internal:9000
CORS_ALLOWED_ORIGINS=https://app.example.com,https://www.app.example.com
```

## Notes

- Set `LAVINMQ_URL` to the AMQP or AMQPS connection URL for your CloudAMQP LavinMQ instance.
- The instance page at `https://<instance>.lmq.cloudamqp.com/docs/#/` documents the LavinMQ HTTP management API. The app itself still publishes and consumes over AMQP via `amqplib`.
- The proxy now rejects browser origins that are not listed in `CORS_ALLOWED_ORIGINS`.
- The proxy forwards `X-Forwarded-*` headers so upstream services can trust the real client IP.
- The frontend should never call `main-server` or `secondary-server` directly in production.
