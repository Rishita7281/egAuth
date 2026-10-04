# eGAuth

eGAuth is a digital identity verification system built to reduce impersonation and replay attacks in high-trust workflows. It issues AES-encrypted QR credentials, rotates the active key bundle every 5 minutes, and distributes those keys across internal services through LavinMQ on CloudAMQP.

## Why This Project Works

eGAuth is strong for a learning project because it combines practical security controls with a simple deployment model:

- QR credentials are short-lived, so stolen screenshots or copied payloads become useless quickly.
- Sensitive services are split behind a proxy, which reduces direct exposure of internal APIs.
- AES is used for the actual QR payload, while RSA is used only to protect the rotating AES key bundle.
- The same current key bundle is shared across services, so verification stays consistent without tightly coupling the services together.

## What It Uses

- `React` for the client UI
- `Node.js` and `Express` for the backend services
- `MongoDB` for application data
- `LavinMQ on CloudAMQP` for AMQP-based key distribution
- `Redis` as an optional warm-start cache for the latest key bundle
- `AES-256` for QR payload encryption
- `RSA` for secure exchange of rotating AES keys

## Why Rotation Is Efficient

The rotation design reduces computation cost instead of increasing it:

- The system rotates one shared AES key bundle every 5 minutes instead of doing a full asymmetric key exchange for every QR request.
- RSA is only used to encrypt the small key bundle, which is much cheaper overall than encrypting every QR payload with RSA.
- QR payload generation uses AES, which is fast and well-suited for repeated encryption.
- `main-server` publishes one key update to the broker, and `secondary-server` reuses that key for many QR generations until the next rotation window.
- The fallback cache and internal key-bundle bootstrap prevent unnecessary re-computation after restarts.

## Stack

- `client`: React application
- `proxy-server`: public API and WebSocket gateway
- `main-server`: internal API plus key publisher
- `secondary-server`: internal QR generation and verification service
- `MongoDB`: primary datastore
- `LavinMQ on CloudAMQP`: AMQP message broker for encrypted key fanout
- `Redis`: optional key cache for warm starts

## Prerequisites

- Node.js
- MongoDB
- A LavinMQ instance on CloudAMQP, or another AMQP-compatible broker for local development
- Optional Redis

## Local Setup

1. Install server dependencies:

```bash
cd server
npm install
```

2. Install client dependencies:

```bash
cd client
npm install
```

3. Create backend environment variables from [`server/.env.example`](/d:/projects/eGAuth/server/.env.example) and set:

- `MONGODB_URI` or `DB_USER` and `DB_PASSWORD`
- `LAVINMQ_URL` with the AMQP or AMQPS connection URL from CloudAMQP
- `JWT_ADMIN_SECRET`
- `JWT_USER_SECRET`
- `JWT_DEPT_SECRET`
- `JWT_EMP_SECRET`
- `PROXY_INTERNAL_SECRET`
- `RSAPUBLIC`
- `RSAPRIVATE`
- `ALGORITHM`

4. Create client environment variables from [`client/.env.example`](/d:/projects/eGAuth/client/.env.example).

5. Start the backend services from the `server` directory in separate terminals:

```bash
npm run start:main
```

```bash
npm run start:secondary
```

```bash
npm run start:proxy
```

6. Start the frontend from the `client` directory:

```bash
npm start
```

The client runs on `http://localhost:3000` by default.

## .env Note

`.env` is intentionally included in this repository for this learning project so the app can be run and tested directly without extra setup. This is only for local/demo convenience and should not be treated as a production security practice.

## Seed Data

From the `server` directory:

```bash
npm run seed
```

Seeded credentials:

- Admin: `admin` / `Admin@123`
- Department pass for `DPT-001` and `DPT-002`: `Dept@123`
- Employee pass: `Emp@123`
- User pass: `User@123`

Seeded records:

- Departments: `DPT-001`, `DPT-002`
- Employees: `EMP-1001`, `EMP-1002`, `EMP-2001`
- Users: `user001`, `user002`

## Messaging Notes

- The broker integration uses `amqplib` over AMQP 0-9-1.
- `main-server` publishes encrypted AES key bundles to the `key_exchange` fanout exchange.
- `secondary-server` consumes from that exchange and falls back to Redis if it needs to warm state after startup.
- The CloudAMQP LavinMQ docs page at `https://<instance>.lmq.cloudamqp.com/docs/#/` is the instance HTTP API, useful for management and inspection. Runtime message flow still uses the AMQP connection URL configured in `LAVINMQ_URL`.

## Production

Production deployment details are in [`DEPLOYMENT.md`](/d:/projects/eGAuth/DEPLOYMENT.md).

Current production shape:

- `client` is deployed separately as a static app
- `proxy-server` is the only public backend origin
- `main-server` and `secondary-server` stay private behind the proxy
- MongoDB, LavinMQ on CloudAMQP, and optional Redis are external infrastructure services

## Summary

eGAuth uses rotating encrypted QR payloads, a proxy-first service boundary, and broker-based key distribution to keep identity verification short-lived, auditable, and resistant to replay.
