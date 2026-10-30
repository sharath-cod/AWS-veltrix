# Rural Assistant – Backend

Express + MongoDB (Mongoose) API for the Offline-First Multilingual AI Assistant for Rural Citizens.

## Run locally
```bash
cp .env.example .env     # then fill in MONGODB_URI
npm install
npm run dev              # or: npm start
```

## Environment
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (required in production) |
| `PORT` | Server port (default 5000; Render sets it automatically) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Comma-separated allowed browser origins. Empty = allow all in development, none in production |

## Endpoints
| Route | Status |
|---|---|
| `GET /api/health` | Implemented |
| `/api/knowledge`, `/api/query`, `/api/schemes`, `/api/scholarships`, `/api/reminders`, `/api/scam-check`, `/api/sync` | Placeholder (HTTP 501) |

All responses are JSON: `{ "success": boolean, ... }`. Errors: `{ "success": false, "error": { "message", "code" } }`.

## Structure
`server.js` (boot) → `src/app.js` (Express app) → `src/routes` → `src/controllers` → `src/services` → `src/models`.
