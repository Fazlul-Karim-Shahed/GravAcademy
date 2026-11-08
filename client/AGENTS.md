<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 🚨 MANDATORY DEPLOYMENT & SYNC RULES

### 1. Frontend Changes (`client/`)
- Every time any file in `client/` is modified, commit and push to GitHub (`origin/main`) so Vercel can automatically build and update the live website.

### 2. Backend Changes (`server/`)
- Every time any file in `server/` is modified:
  1. Build the backend: `npm --prefix server run build`
  2. Sync `server/dist/`, `server/src/`, `server/public/` directly to `/home/ubuntu/gravacademy-backend/` on the Oracle Cloud server (`138.2.92.182` using `~/.ssh/priyo_server.pem`).
  3. Reload PM2: `pm2 reload gravacademy-backend && pm2 save`.
  4. Local backend and the Oracle Cloud backend MUST always remain in exact sync.

