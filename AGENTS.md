# AGENTS.md — Development, Deployment & Synchronization Rules

This document outlines mandatory rules and protocols for all AI agents and developers working on the **Grav Academy** codebase.

---

## 🚨 CORE DEPLOYMENT & SYNCHRONIZATION RULES (MANDATORY)

### 1. Frontend Changes (`client/`) ➔ Automatic GitHub Push
Whenever any changes are made to the frontend code in `client/`:
- **Always commit and push to GitHub (`origin/main`)**:
  - Keep commits clean and descriptive (e.g. `feat(client): ...` or `fix(client): ...`).
  - This ensures that **Vercel** triggers automated builds and updates the live production frontend without delay.

---

### 2. Backend Changes (`server/`) ➔ Strict Real-Time Oracle Cloud Sync
The production backend is hosted on a dedicated **Oracle Cloud VM**:
- **Host / IP:** `138.2.92.182`
- **User:** `ubuntu`
- **SSH Key:** `~/.ssh/priyo_server.pem`
- **Remote Directory:** `/home/ubuntu/gravacademy-backend`
- **PM2 App Name:** `gravacademy-backend`
- **Live URL / Web Telemetry:** `https://gravapi.138.2.92.182.nip.io/`
- **API Endpoint:** `https://gravapi.138.2.92.182.nip.io/api/v1`

#### ⚡ Rule:
Whenever **ANY** backend file in `server/` is modified (controllers, routes, models, services, configs, public files, etc.):
1. **Compile & Verify TypeScript:**
   ```bash
   npm --prefix server run build
   ```
2. **Synchronize Files to Oracle Server:**
   Sync the updated `server/src/`, `server/dist/`, `server/public/`, and config files directly to `/home/ubuntu/gravacademy-backend/` via SCP / SSH:
   ```bash
   scp -i "$HOME/.ssh/priyo_server.pem" -r server/dist/* ubuntu@138.2.92.182:/home/ubuntu/gravacademy-backend/dist/
   scp -i "$HOME/.ssh/priyo_server.pem" -r server/src/* ubuntu@138.2.92.182:/home/ubuntu/gravacademy-backend/src/
   scp -i "$HOME/.ssh/priyo_server.pem" -r server/public/* ubuntu@138.2.92.182:/home/ubuntu/gravacademy-backend/public/
   ```
3. **Reload PM2 on the Server:**
   ```bash
   ssh -i "$HOME/.ssh/priyo_server.pem" ubuntu@138.2.92.182 "pm2 reload gravacademy-backend && pm2 save"
   ```
4. **Hard Requirement:** The Oracle Cloud backend must ALWAYS run identical code and be in exact sync with local backend code. There should never be drift between local development and the Oracle server.

---

## 🛠️ Architecture & Credentials Overview

## 🎨 DESIGN SYSTEM RULES (MANDATORY)

All frontend design work must follow the user's established preference:
- Smart, simple, professional, beautiful, student-friendly and eye-soothing.
- Avoid an AI-generated look, excessive decoration, unnecessary text and bulky card nesting.
- A real design upgrade must consider layout hierarchy, component structure, spacing, responsive behavior, interaction states, CTA clarity and visual consistency—not only font or color changes.
- Keep labels short and natural; prefer one or two words for buttons whenever possible.
- Preserve approved page patterns and reference designs across related pages.
- Verify mobile, tablet and desktop layouts before considering a frontend design task complete.

- **Database:** MongoDB Atlas (AWS Cluster `cluster0.vywt2me.mongodb.net`, database `grav_academy`)
- **Live Video / Classroom:** LiveKit Cloud (`wss://gravacademy-1apvh2ag.livekit.cloud`)
- **Web Server Reverse Proxy:** Nginx with Let's Encrypt SSL/TLSv1.3 and HTTP/2 proxying port `5000`.
- **System Service:** `pm2-ubuntu.service` runs on startup and manages auto-resurrection.

