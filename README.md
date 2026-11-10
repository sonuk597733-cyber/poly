# CollegeOS — Digital Polytechnic College Management Platform
**Institution:** Swami Vivekanand Subharti University / Subharti Polytechnic  
**Stack:** React 19 · Vite · Three.js · Node.js · Express · MongoDB · Mongoose · JWT

---

## 1. System Architecture

```
CollegeOS/
├── frontend/                     # React 19 + Vite Frontend SPA
│   ├── public/                   # Static branding assets (SVSU crest, icons)
│   ├── src/
│   │   ├── components/           # AuthLayout, Campus3DCanvas, UI components
│   │   ├── data/                 # Campus chapters & metadata
│   │   ├── pages/                # Home, Login, Register, ForgotPassword, ResetPassword
│   │   ├── services/             # authApi.js (centralized API client with credentials)
│   │   ├── App.jsx               # Client router & session initialization
│   │   └── main.jsx              # React DOM entry point
│   ├── .env.example              # Frontend environment variables template
│   └── package.json
│
├── backend/                      # Production-Grade Express & MongoDB Backend
│   ├── src/
│   │   ├── config/               # db.js (centralized MongoDB connection manager)
│   │   ├── controllers/          # authController.js (register, login, me, logout, recovery)
│   │   ├── middleware/           # authMiddleware, rateLimitMiddleware, errorMiddleware
│   │   ├── models/               # User.js (Mongoose schema with bcrypt hashing)
│   │   ├── routes/               # authRoutes.js
│   │   ├── services/             # emailService.js (SMTP transporter + dev simulation)
│   │   ├── utils/                # tokens.js, validators.js, seed.js
│   │   ├── app.js                # Express app setup (Helmet, CORS, cookies, healthcheck)
│   │   └── server.js             # Server entry point with graceful shutdown
│   ├── tests/                    # Automated integration tests (node:test + supertest)
│   ├── .env.example              # Backend environment variables template
│   └── package.json
│
├── package.json                  # Root orchestration scripts
├── .gitignore                    # Git exclusion rules
└── README.md
```

---

## 2. Prerequisites

- **Node.js:** v18.0.0 or higher (Tested on `v25.7.0`)
- **MongoDB:** Local instance running on port `27017` or a MongoDB Atlas connection string.

---

## 3. Quick Start & Setup

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables
Copy the `.env.example` files to `.env` in both folders:

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/collegeos
JWT_SECRET=collegeos_svsu_local_dev_jwt_secret_polytechnic_2026
JWT_EXPIRES_IN=7d
EMAIL_FROM="CollegeOS Gateway <no-reply@subharti.org>"
```

**Frontend (`frontend/.env`):**
```env
VITE_API_BASE_URL=/api
```

### Step 3: Seed Initial Demo Credentials
Populate MongoDB with pre-hashed demo accounts:
```bash
# From root or backend folder
npm run seed
```
This creates:
- **Demo Student:** `student.demo@subharti.org` / `Student@123` (Role: `student`, Branch: `CSE`, 3rd Year)
- **Demo Faculty:** `faculty.demo@subharti.org` / `Faculty@123` (Role: `teacher`, Dept: `Mechanical Engineering`)

### Step 4: Run Development Servers
In two separate terminal sessions:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend SPA (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 4. API Endpoints

| Method | Endpoint | Access | Description | Rate Limited |
|---|---|---|---|:---:|
| `GET` | `/api/health` | Public | System uptime & MongoDB connection health check | No |
| `POST` | `/api/auth/register` | Public | Register new student or staff access request (bcrypt hashed) | Yes (25/15m) |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns safe profile + sets HTTP-only cookie | Yes (25/15m) |
| `GET` | `/api/auth/me` | Protected | Returns safe profile of authenticated session | No |
| `POST` | `/api/auth/logout` | Protected | Invalidate session and clear HTTP-only cookie | No |
| `POST` | `/api/auth/forgot-password`| Public | Request 15-min password reset link (prevents user enumeration)| Yes (10/15m) |
| `POST` | `/api/auth/reset-password` | Public | Set new password with valid cryptographic token | Yes (10/15m) |

---

## 5. Security & Role Architecture

1. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with work factor 10.
2. **Cryptographic Reset Tokens:** Password reset tokens use 32 random bytes from `node:crypto`. Only the SHA-256 hash of the token is saved in MongoDB with a 15-minute expiration timestamp. Tokens cannot be reused.
3. **Prevention of Public Role Escalation:** Public registration rejects any attempt to register an `admin` account. Staff roles (`teacher`, `coordinator`, `hod`, `principal`) are provisioned with status `pending_approval` and require administrative authorization before elevated privileges are granted.
4. **Provisioning the First Administrator:**
   To securely create an initial Administrator, run a direct script on the server environment without exposing a public API endpoint:
   ```javascript
   // Inside backend/src/utils/createAdmin.js (or CLI command)
   const hash = await User.hashPassword(process.env.INITIAL_ADMIN_PASSWORD);
   await User.create({
     fullName: "Dean of Academic Affairs",
     email: "admin.dean@subharti.org",
     passwordHash: hash,
     role: "admin",
     status: "active"
   });
   ```
5. **Session Cookies & JWT:** Tokens are issued with a 7-day expiration and stored in HTTP-only, secure, `SameSite=Lax` cookies, with matching `Authorization: Bearer <token>` support for cross-origin setups.
6. **Centralized Error Sanitization:** Mongoose validation errors, duplicate key violations (`E11000`), and JWT errors are handled centrally, never exposing database internals or stack traces in production.

---

## 6. Automated Testing & Verification

Run the automated backend test suite:
```bash
npm test
```

### Test Coverage (`16/16 Passed`):
- `GET /api/health` returns HTTP 200 and reports live MongoDB connection status.
- `POST /api/auth/register` successfully creates records in MongoDB with bcrypt hashes and safe JSON serialization.
- Duplicate email registration returns HTTP 409 Conflict.
- Invalid registration payloads return HTTP 400 with specific field errors.
- Privileged `admin` role escalation via public registration is blocked with HTTP 400.
- `POST /api/auth/login` verifies bcrypt credentials and sets HTTP-only cookies.
- Incorrect credentials return generic HTTP 401 without revealing account existence.
- `GET /api/auth/me` rejects unauthenticated requests and permits valid JWT/cookies.
- `POST /api/auth/logout` invalidates session cookie.
- `POST /api/auth/forgot-password` returns generic HTTP 200 for both registered and ghost accounts.
- `POST /api/auth/reset-password` rejects invalid tokens, accepts valid tokens, updates password hashes, and blocks token reuse.

---

## 7. Frontend Verification

Run static code analysis and production bundling:
```bash
# Static analysis with oxlint
npm run lint

# Production compilation with Vite
npm run build
```
Result: Bundled cleanly in 2.09s (`dist/assets/index-*.js`).
