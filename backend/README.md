# Demo Backend

## Table of Contents

- [Demo Backend](#demo-backend)
  - [Table of Contents](#table-of-contents)
- [Demo Backend (Express + File DB)](#demo-backend-express--file-db)
  - [1. Quick Start](#1-quick-start)
    - [Install](#install)
    - [Run](#run)
    - [Defaults](#defaults)
  - [2. Environment Variables](#2-environment-variables)
  - [3. API Overview (base `/api/v1`)](#3-api-overview-base-apiv1)
  - [4. Authentication](#4-authentication)
  - [5. Edge Header Enforcement](#5-edge-header-enforcement)
  - [6. Data Storage](#6-data-storage)
  - [7. Running](#7-running)
  - [8. Notes](#8-notes)
  - [9. Production Tips](#9-production-tips)
  - [10. Health, Logs \& Restart](#10-health-logs--restart)

# Demo Backend (Express + File DB)

## 1. Quick Start

### Install

```bash
cd backend
npm i
```

Secure copy `.env` file into the backend folder (use `scp`)

### Run

—
Use the npm scripts; they set `NODE_ENV` for you.

| Mode        | Command         | `NODE_ENV` used                  | What                                                                                            |
| ----------- | --------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Development | `npm run dev`   | `development` (overrides `.env`) | Seeds users from `config.js.SAMPLE_USERS`, skips edge header check, listens on `127.0.0.1:3000` |
| Production  | `npm run start` | `production` (overrides `.env`)  | No sample users (empty array), edge header enforced via NGINX, listens on `127.0.0.1:3000`      |

> Only if you run `node src/index.js` directly should you care about `NODE_ENV` in `.env`.

**Admin & sample users:** There is **one admin** (`admin`) with password from `config.js` → `ADMIN_DEFAULT_PASSWORD`. **Sample users** apply **only in development** and are defined in `config.js → SAMPLE_USERS`. Set it to an empty array `[]` to disable.

**Switching via `.env`:** Only relevant if you run the app directly with `node src/index.js`. In that case, set `NODE_ENV=development` or `NODE_ENV=production` in `.env`. When using `npm run dev` or `npm start`, the scripts force the mode regardless of `.env`.

**Admin & sample users:** There is **one admin** (`admin`) with password from `config.js` → `ADMIN_DEFAULT_PASSWORD`. **Sample users** apply **only in development** and are defined in `config.js → SAMPLE_USERS`. Set it to an empty array `[]` to disable.

### Defaults

| Item                        | Value / Location                                                           |
| --------------------------- | -------------------------------------------------------------------------- |
| **Port**                    | `127.0.0.1:3000`                                                           |
| **Admin user**              | Username: `admin` — Password from `config.js` (`ADMIN_DEFAULT_PASSWORD`)   |
| **Sample users (dev only)** | Defined in `config.js` under `SAMPLE_USERS`. Empty array disables seeding. |

All connections use plain HTTP on `127.0.0.1:3000` by default, both in dev and production. In production, NGINX will communicate via HTTPS with the internet while loops back to the backend API.

---

## 2. Environment Variables

Located in `.env` (copy from `.env.example`).

| Variable                 | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `NODE_ENV`               | `development` or `production`                          |
| `PORT`                   | Defaults to `3000`                                     |
| `JWT_SECRET`             | Secret for signing tokens                              |
| `TOKEN_TTL_HOURS`        | Token lifetime in hours                                |
| `ADMIN_DEFAULT_PASSWORD` | Password for the `admin` account                       |
| `EDGE_HEADER_NAME`       | Default: `X-Edge-Secret`                               |
| `EDGE_SECRET`            | Secret expected from CloudFront via NGINX              |
| `CORS_ORIGIN`            | Allowed frontend origin (e.g., `https://mydomain.com`) |

---

## 3. API Overview (base `/api/v1`)

**Public Endpoints**

| Method | Path           | Purpose                                |
| ------ | -------------- | -------------------------------------- |
| POST   | `/auth/signup` | Create a new user account              |
| POST   | `/auth/signin` | Sign in with username and password     |
| GET    | `/healthz`     | Health check (no auth, no edge header) |

**Protected Endpoints (require JWT in `Authorization: Bearer <token>` and Edge Header)**

| Method | Path                              | Purpose                           |
| ------ | --------------------------------- | --------------------------------- |
| GET    | `/user/me`                        | Retrieve current user info        |
| PUT    | `/user/password`                  | Change current user’s password    |
| GET    | `/items`                          | Get all items                     |
| POST   | `/items`                          | Add a new item                    |
| PUT    | `/items`                          | Update an existing item           |
| DELETE | `/items`                          | Delete an item                    |
| GET    | `/admin/users`                    | List all users (admin)            |
| POST   | `/admin/users`                    | Add a new user (admin)            |
| PUT    | `/admin/users`                    | Update user info (admin)          |
| DELETE | `/admin/users`                    | Remove user (admin)               |
| POST   | `/admin/users/:id/reset-password` | Reset user password (admin)       |
| POST   | `/admin/users/:id/validate`       | Validate a user account (admin)   |
| POST   | `/admin/users/:id/invalidate`     | Invalidate a user account (admin) |

---

## 4. Authentication

- JWT-based: tokens are signed with `JWT_SECRET` and have a configurable expiry. Configurable in `.env`
- All `/api/v1/*` routes require both a valid JWT and, in production, the Edge secret header, except `/auth/*` and `/healthz`.

---

## 5. Edge Header Enforcement

- Enforced by **NGINX**, not by Node in dev mode.
- In production, NGINX must include the secret header `X-Edge-Secret: <value>`.
- Skipped in development for convenience.

---

## 6. Data Storage

- File-based JSON database at `data/db.json`.
- Atomic writes via temp + rename.
- Admin and optional sample users are seeded at startup.

---

## 7. Running

```bash
# development
npm run dev

# production
npm start
```

Backend listens on 127.0.0.1:3000 in both modes.

---

## 8. Notes

- **Base path:** All endpoints are under `/api/v1`.
- **Public endpoints:** `/auth/signin`, `/auth/signup`, `/healthz`.
- **Auth:** All other routes require `Authorization: Bearer <token>` with a valid JWT.
- **File database:** Data is stored at `data/db.json`. Writes are atomic (temp + rename). Back up this file regularly; consider snapshotting before upgrades.
- **Security in production (summary):** NGINX enforces the edge secret header (`X-Edge-Secret`) for all `/api/v1/*`;
  1. In CloudFront origin settings for `/api/*`, add a custom header:
     ```
     X-Edge-Secret: <same-value-as-EDGE_SECRET>
     ```
  2. In `.env`, set:
     ```
     EDGE_SECRET=<same-value>
     ```
- the backend applies Helmet defaults, rate-limits auth routes, restricts CORS to `CORS_ORIGIN`, and caps JSON body size at ~256 KB.
- **Dev convenience:** Edge header checks are skipped in development; sample users are seeded from `config.js > SAMPLE_USERS`.

---

## 9. Production Tips

- Use a process manager like pm2.
  ```bash
  pm2 start src/index.js --name backend
  pm2 save
  pm2 startup
  pm2 logs backend
  ```
- Back up `data/db.json`.
- Set strong secrets for JWT and Edge.
- There are NO sample users in production. You must create ones.

---

## 10. Health, Logs & Restart

- **Health:** `GET /healthz` returns `{ ok: true }` and is intentionally public. Use it for CloudFront/ALB/NGINX health checks.
- **Logs:** Uses morgan — `dev` format in development, `combined` in production.
- **Restart (dev):** Nodemon watches `src/` and ignores `data/**` (to avoid restart loops on DB writes). If you didn’t add it yet, use a `nodemon.json` with:

  ```json
  {
    "watch": ["src"],
    "ext": "js,json",
    "ignore": ["data/**", "*.tmp", "node_modules/**"]
  }
  ```

- **Restart (prod):** With `pm2` after updates:
  ```
      pm2 start src/index.js --name demo-api
      pm2 reload demo-api
  ```
