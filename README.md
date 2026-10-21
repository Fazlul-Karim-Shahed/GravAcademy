# Grav Academy - EdTech LMS Platform

Production-oriented Learning Management System (LMS) designed for coaching centers in Bangladesh (Class 6 to Class 12). Built with Next.js App Router, Express, TypeScript, and Online MongoDB Atlas.

---

## 1. Project Architecture

- **`client/`**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Glassmorphism dark UI theme.
- **`server/`**: Express.js REST API (`/api/v1`), TypeScript, Mongoose, Zod schema validation, Argon2/Bcrypt password hashing, and JWT session handling.
- **Database**: Strictly **Online MongoDB Atlas** (No local MongoDB dependency).
- **File Management**: Direct automatic streaming to your personal Gmail Google Drive via Google Drive API v3 (OAuth 2.0).
- **Lectures**: Clean YouTube embedded player without extraneous distractions.
- **Examinations**: Server-side auto-graded MCQs with negative marking support and secure question answer key isolation.

---

## 2. Setting Up Online MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Create a Free Cluster (M0).
3. Under **Database Access**, create a database user and note the password.
4. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** -> Copy the connection string.
6. Open [`server/.env`](file:///e:/Skills/Web%20Development/GravAcademy/server/.env) and set your URI:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/grav_academy?retryWrites=true&w=majority
   ```

---

## 3. Configuring Google Drive Automatic Uploads (Personal Gmail)

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Create OAuth 2.0 Client Credentials (Desktop / Web).
4. Authorize your personal Gmail account to obtain a `refresh_token`.
5. In [`server/.env`](file:///e:/Skills/Web%20Development/GravAcademy/server/.env):
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_DRIVE_FOLDER_ID=your_optional_root_folder_id
   ```

---

## 4. Running the Development Servers

From the root directory:

1. **Start the Backend Server**:
   ```bash
   npm run dev:server
   ```
   *Runs at `http://localhost:5000` (Health check: `http://localhost:5000/health`)*

2. **Start the Frontend Client**:
   ```bash
   npm run dev:client
   ```
   *Runs at `http://localhost:3000`*

---

## 5. Security & RBAC Enforcement

- **Public Registration**: Every public signup is guaranteed the `student` role by design (`/auth/register`). No privilege escalation can occur from client payloads.
- **Protected Roles**: `superadmin`, `admin`, `teacher`, `guardian`, `employee` can only be configured by authorized administrative roles.
- **Batch Duplication**: The batch cloner deep-copies the entire hierarchy (`Module` $\to$ `Section` $\to$ `Lesson`) creating distinct MongoDB documents, preserving order indices while maintaining zero mutation risks on the source batch.
- **File Security**: Raw Google Drive links are never exposed to students. Access is strictly proxied through `/api/v1/documents/:id/stream` which verifies enrollment.