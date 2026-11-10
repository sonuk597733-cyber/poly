# CollegeOS — Enterprise Priority Remediation & Engineering Work Plan
**Target**: Transform CollegeOS from High-Quality Academic Core (Score: 7.34/10) to 10/10 University-Grade Enterprise ERP  
**Total Action Items**: 16 Targeted Engineering Epics across 4 Strict Priority Phases  
**Standard**: Principal Architect Execution Blueprint  

---

## Phase Overview Matrix

```
+-----------------------------------------------------------------------------------------+
| PHASE EXECUTION TIMELINE & TARGET SCORE ROADMAP                                         |
+-------+------------------------------------------+-------+---------------+--------------+
| Phase | Focus Description                        | Tasks | Current Score | Target Score |
+-------+------------------------------------------+-------+---------------+--------------+
| P0    | Critical Blockers & Security Vulnerab.   |   4   |   5.8 / 10    |   8.2 / 10   |
| P1    | Core ERP Operations & Performance Tuning |   4   |   7.3 / 10    |   8.9 / 10   |
| P2    | Advanced Reporting, Cache & Sockets      |   4   |   8.0 / 10    |   9.4 / 10   |
| P3    | Full-Spectrum Enterprise Facilities      |   4   |   4.5 / 10    |  10.0 / 10   |
+-------+------------------------------------------+-------+---------------+--------------+
```

---

## 1. Phase P0 — Critical Production Blockers & Security Remediations (Immediate 72-Hour Sprint)

### Task P0-1: Integrate Production Payment Gateway (Razorpay / Stripe)
- **Role / Module**: Student Fees & Finance (`feeRoutes.js`, `feeController.js`, `StudentFees.jsx`)
- **Current Score**: **4.2 / 10** ──► **Target Score**: **9.5 / 10**
- **Required Changes**:
  1. Create `POST /api/fees/create-order` using Razorpay SDK (`razorpay.orders.create({ amount, currency: "INR", receipt })`).
  2. Implement webhook listener `POST /api/fees/verify-webhook` verifying `x-razorpay-signature` using HMAC-SHA256 secret.
  3. Mark invoices as `PAID` only after valid cryptographic signature verification.
- **Dependencies**: Razorpay Merchant Account API keys in `.env`.
- **Complexity**: **HIGH (Critical)**

### Task P0-2: Connect Public Admission & Contact Forms to Database
- **Role / Module**: Public Portal (`Home.jsx`, new `inquiryController.js`, new `inquiryRoutes.js`)
- **Current Score**: **5.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**:
  1. Create Mongoose model `AdmissionInquiry.js` (name, mobile, email, branchPreference, marksPercentage, status).
  2. Implement backend endpoint `POST /api/admission/inquiry` with Zod validation.
  3. Replace frontend `setTimeout` in `Home.jsx` with live API call and toast notification.
- **Dependencies**: None.
- **Complexity**: **LOW (High Impact)**

### Task P0-3: Database-Drive Admin Branches & Roles Management
- **Role / Module**: Admin Dashboard (`AdminBranches.jsx`, `AdminRoles.jsx`, `adminController.js`)
- **Current Score**: **4.5 / 10** ──► **Target Score**: **9.2 / 10**
- **Required Changes**:
  1. Create `Department` and `RolePermission` Mongoose models with CRUD operations.
  2. Connect frontend branch creation and role permission toggles to live API endpoints.
  3. Remove hardcoded static arrays in React state.
- **Dependencies**: None.
- **Complexity**: **MEDIUM**

### Task P0-4: Sanitize File Upload Paths & Prevent Directory Traversal
- **Role / Module**: Common Infrastructure (`notesController.js`, `assignmentController.js`)
- **Current Score**: **6.5 / 10** ──► **Target Score**: **9.8 / 10**
- **Required Changes**:
  1. Strictly sanitize file paths using `path.basename` and enforce `path.resolve(UPLOAD_DIR, filename).startsWith(UPLOAD_DIR)`.
  2. Enforce MIME type checking beyond basic file extensions using `file-type` buffer sniffing.
- **Dependencies**: `file-type` package.
- **Complexity**: **LOW**

---

## 2. Phase P1 — Essential Core ERP Operations & Scalability (Weeks 1 - 2)

### Task P1-1: Route-Level React Lazy Loading & Bundle Splitting
- **Role / Module**: Frontend Infrastructure (`frontend/src/App.jsx`, `vite.config.js`)
- **Current Score**: **6.0 / 10** ──► **Target Score**: **9.5 / 10**
- **Required Changes**:
  1. Refactor route imports into dynamic imports using `React.lazy(() => import('./pages/...'))`.
  2. Configure manual chunking in `vite.config.js` (`vendor`, `charts`, `lucide`, `pdf`).
  3. Reduce initial bundle size from **3.32 MB to < 450 kB**.
- **Dependencies**: None.
- **Complexity**: **MEDIUM**

### Task P1-2: Automated Background Cron Tasks Engine
- **Role / Module**: Common Advanced Systems (`backend/src/jobs/scheduler.js`)
- **Current Score**: **4.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**:
  1. Integrate `node-cron` for automated nightly jobs.
  2. Job 1: Midnight attendance summary recalculation and defaulter (<75%) flag updates.
  3. Job 2: Fee late payment penalty calculation at start of each academic month.
- **Dependencies**: `node-cron`.
- **Complexity**: **MEDIUM**

### Task P1-3: Dedicated Parent Portal Dashboard
- **Role / Module**: Parent Portal (`frontend/src/pages/parent/`, `authRoutes.js`)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **8.8 / 10**
- **Required Changes**:
  1. Add `PARENT` role to user schema linked to student's `enrollmentNo`.
  2. Implement streamlined guardian dashboard displaying attendance percentage, sessional marks, and fee payment status.
- **Dependencies**: User schema migration.
- **Complexity**: **HIGH**

### Task P1-4: SMS & WhatsApp Automated Gateway Integration
- **Role / Module**: Notifications (`backend/src/services/smsService.js`)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**:
  1. Connect Fast2SMS or Twilio for critical OTP and exam result publication alerts.
  2. Connect WhatsApp Cloud API for dispatching official SVSU marksheet PDF links to parents.
- **Dependencies**: SMS / Meta WhatsApp Business credentials.
- **Complexity**: **HIGH**

---

## 3. Phase P2 — Performance, Reporting & Enhanced Workflows (Weeks 3 - 4)

### Task P2-1: Redis Distributed Caching for Examination Ceilings & Schedules
- **Role / Module**: Backend Architecture (`backend/src/config/redis.js`)
- **Current Score**: **6.5 / 10** ──► **Target Score**: **9.5 / 10**
- **Required Changes**:
  1. Cache `/api/academic/exam-marks/ceiling` responses in Redis with 1-hour TTL.
  2. Invalidate cache instantly upon faculty ceiling updates (`POST /ceiling`).
  3. Protect MongoDB Atlas connection pool during peak result-checking traffic.
- **Dependencies**: Redis cluster instance.
- **Complexity**: **MEDIUM**

### Task P2-2: Server-Side PDF Rendering (Puppeteer / PDFKit)
- **Role / Module**: Student Results & Admin Gazette (`academicController.js`)
- **Current Score**: **7.5 / 10** ──► **Target Score**: **9.6 / 10**
- **Required Changes**:
  1. Generate tamper-proof, server-side signed PDF marksheet documents with embedded SHA256 verification hash.
  2. Eliminate browser-dependent print CSS rendering discrepancies.
- **Dependencies**: `pdfkit` or `puppeteer-core`.
- **Complexity**: **HIGH**

### Task P2-3: Multi-Document ACID Transactions for Batch Marks Entry
- **Role / Module**: Academic Engine (`academicController.js`)
- **Current Score**: **7.5 / 10** ──► **Target Score**: **9.8 / 10**
- **Required Changes**:
  1. Wrap `enterBatchMarks` inside `session.withTransaction()`.
  2. Ensure all 60 students in a class ledger are saved atomically or rollback completely on error.
- **Dependencies**: MongoDB replica set (Atlas enabled).
- **Complexity**: **MEDIUM**

### Task P2-4: Cloud Object Storage Migration (AWS S3)
- **Role / Module**: Resource Hub (`lectureController.js`, `notesController.js`)
- **Current Score**: **7.0 / 10** ──► **Target Score**: **9.5 / 10**
- **Required Changes**:
  1. Stream lecture video uploads directly to private AWS S3 bucket with signed CloudFront URLs.
  2. Decouple file persistence from local container disk.
- **Dependencies**: AWS S3 Bucket & IAM policy.
- **Complexity**: **HIGH**

---

## 4. Phase P3 — Enterprise Extensions & Facilities (Weeks 5 - 8)

### Task P3-1: Full Hostel & Mess Management Engine
- **Role / Module**: Enterprise Facilities (Models, Controllers, UI)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**: Build building, room, bed inventory, student room allotment, and mess billing ledger.
- **Complexity**: **HIGH**

### Task P3-2: Bus Fleet & Transportation Engine
- **Role / Module**: Enterprise Facilities (Models, Controllers, UI)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**: Bus route mapping, pickup stop fee tiers, driver allocation, and student boarding pass QR codes.
- **Complexity**: **HIGH**

### Task P3-3: Staff Payroll & Biometric HR Engine
- **Role / Module**: Enterprise HR (Models, Controllers, UI)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **9.2 / 10**
- **Required Changes**: Faculty salary structures (Basic, HRA, DA, EPF), monthly payslip generation, leave ledger.
- **Complexity**: **CRITICAL**

### Task P3-4: Native AI Academic Doubt-Solver
- **Role / Module**: Academic Hub (`backend/src/services/aiService.js`)
- **Current Score**: **0.0 / 10** ──► **Target Score**: **9.0 / 10**
- **Required Changes**: Integrate Gemini API / Claude API to answer polytechnic student engineering queries grounded in uploaded syllabus notes.
- **Complexity**: **HIGH**
