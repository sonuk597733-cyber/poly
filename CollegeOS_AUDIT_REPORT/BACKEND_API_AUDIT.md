# CollegeOS — Comprehensive Backend Architecture & API Audit
**Audit Scope**: REST API Endpoints, Express Controllers, Middleware Chain, Mongoose Models, and Database Integrity  
**Overall Backend Score**: **7.00 / 10.0**  
**Auditor**: Principal Backend Architect & Database Auditor  

---

## 1. Architectural Overview

The CollegeOS backend is built on Node.js using the Express framework and MongoDB with Mongoose ODM. It implements a layered MVC architecture:

```
   [Client Requests: Web & Mobile]
                 │
                 ▼
   [Express Middleware: Helmet, CORS, Morgan, CookieParser]
                 │
                 ▼
   [Authentication & RBAC: protect(), authorize(roles)]
                 │
                 ▼
   [10 Route Handlers: /api/v1/...]
   ├─ authRoutes.js         ├─ assignmentRoutes.js
   ├─ academicRoutes.js     ├─ notesRoutes.js
   ├─ attendanceRoutes.js   ├─ lectureRoutes.js
   ├─ timetableRoutes.js    ├─ feeRoutes.js
   └─ adminRoutes.js        └─ dashboardRoutes.js
                 │
                 ▼
   [11 Express Controllers]
                 │
                 ▼
   [40 Mongoose Schemas & MongoDB Atlas Cluster]
```

---

## 2. Comprehensive Endpoint Catalog (102 Total Endpoints)

### 2.1. Authentication & Identity (`authRoutes.js` / `authController.js`)
- `POST /api/auth/register` — Role-based user registration with password hashing (Argon2/Bcrypt).
- `POST /api/auth/login` — User authentication with issuance of HTTP-only JWT cookie & response token.
- `GET /api/auth/me` — Returns verified user profile and role claims.
- `POST /api/auth/logout` — Clears session cookies and invalidates client token.
- `POST /api/auth/forgot-password` — Issues cryptographically signed password reset token.
- `PUT /api/auth/reset-password/:token` — Validates reset token and updates password hash.
- `PUT /api/auth/update-password` — In-session password update with `passwordChangedAt` tracking.
- `PUT /api/auth/update-profile` — Updates user contact info and avatar URL.

### 2.2. Academic & Examination Engine (`academicRoutes.js` / `academicController.js`)
- `GET /api/academic/departments` — Returns registered departments and branch configurations.
- `GET /api/academic/subjects` — Returns subjects filtered by branch, semester, and curriculum year.
- `POST /api/academic/subjects` — Adds new course syllabus with credit hours and lab flags.
- `GET /api/academic/schedules` — Retrieves internal examination timetables and room allocations.
- `POST /api/academic/schedules` — Creates sessional examination schedules with invigilator assignments.
- `GET /api/academic/exam-marks/ceiling` — Retrieves configured maximum marks ceiling for Session + Branch + Sem + Subject + Exam.
- `POST /api/academic/exam-marks/ceiling` — Sets and synchronizes maximum marks ceiling across cohort.
- `GET /api/academic/exam-marks` — Retrieves marks ledger filtered by student or course cohort.
- `POST /api/academic/exam-marks/batch` — Atomic upsert of sessional marks for an entire class.
- `PUT /api/academic/exam-marks/:id` — Individual mark adjustment with audit logging.
- `GET /api/academic/exam-marks/student-summary` — Computes Three-Sessional Best-of-Three scorecard for logged-in student.
- `PUT /api/academic/exam-marks/verify-hod` — Level 2 HOD verification of cohort marks.
- `PUT /api/academic/exam-marks/sanction-principal` — Level 3 Principal sanction.
- `PUT /api/academic/exam-marks/publish-admin` — Level 4 Admin publication toggle making results visible to students.

### 2.3. Attendance Management (`attendanceRoutes.js` / `attendanceController.js`)
- `POST /api/attendance/session` — Initializes class attendance session for subject and date.
- `POST /api/attendance/mark-bulk` — Bulk records attendance status (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
- `GET /api/attendance/student-stats` — Returns student-specific attendance percentage and deficit status (<75%).
- `GET /api/attendance/subject-analytics` — Provides faculty with aggregate cohort attendance distribution.
- `GET /api/attendance/defaulter-list` — Generates automated list of students with attendance below regulatory threshold.

### 2.4. Timetable & Scheduling (`timetableRoutes.js` / `timetableController.js`)
- `GET /api/timetable/branch/:branch/semester/:semester` — Returns complete weekly period grid.
- `POST /api/timetable/slot` — Adds or updates timetable slot with instructor and classroom assignment.
- `POST /api/timetable/check-conflict` — Dynamic validation endpoint preventing classroom or faculty overlap.
- `POST /api/timetable/ocr-extract` — Parses uploaded syllabus image/PDF and extracts course structure.

### 2.5. Assignments & Notes (`assignmentRoutes.js`, `notesRoutes.js`)
- `POST /api/assignments` — Faculty creates homework/project assignments with deadline and rubric.
- `GET /api/assignments/student` — Returns pending and submitted assignments for student cohort.
- `POST /api/assignments/:id/submit` — Student uploads assignment submission file.
- `PUT /api/assignments/submission/:id/grade` — Faculty reviews file, enters grade and qualitative feedback.
- `GET /api/notes` — Categorized lecture notes repository filtered by subject and module.
- `POST /api/notes/upload` — Faculty uploads PDF study materials with chapter metadata.
- `GET /api/notes/download/:id` — Audited secure download stream.

### 2.6. Video Lectures & Chunked Media (`lectureRoutes.js` / `lectureController.js`)
- `GET /api/lectures` — Lists available recorded lectures organized by subject syllabus.
- `POST /api/lectures/upload` — Uploads lecture video file with chapter timestamp markers.
- `GET /api/lectures/stream/:id` — **HTTP Range 206 Streaming Engine**: Streams video in 1MB chunks supporting pause, seek, and variable playback speeds without loading entire files into memory.

### 2.7. Fees & Finance Engine (`feeRoutes.js` / `feeController.js`)
- `GET /api/fees/my-status` — Student fee ledger showing tuition dues, scholarship credits, and payment history.
- `POST /api/fees/pay` — **Simulated Payment Endpoint**: Generates synthetic transaction ID and marks status `PAID`.
- `GET /api/fees/receipt/:id` — Renders official fee receipt with college seal.
- `GET /api/fees/admin/ledger` — Super Admin collection report across departments.

### 2.8. Administration & System Operations (`adminRoutes.js` / `adminController.js`)
- `GET /api/admin/audit-logs` — Paginated query of system security and grade modification logs.
- `GET /api/admin/users` — User management list with role filtering and account activation toggles.
- `POST /api/admin/broadcast-notice` — Dispatches system-wide announcements to student/faculty boards.
- `GET /api/admin/system-health` — Monitors database connectivity, server uptime, and memory usage.

---

## 3. Database Schema & Indexing Audit (40 Mongoose Models)

### Core Schema Highlights:
1. **ExamMark (`backend/src/models/ExamMark.js`)**:
   - Fields: `studentId`, `subjectId`, `branch`, `semester`, `academicSession`, `examType`, `marksObtained`, `maxMarks`, `approvalStatus`, `auditTrail`.
   - **Compound Index**: `{ academicSession: 1, branch: 1, semester: 1, subjectId: 1, examType: 1 }` provides O(log n) lookup during bulk grade calculations.
2. **ExamSchedule (`backend/src/models/ExamSchedule.js`)**:
   - Fields: `examType`, `academicSession`, `branch`, `semester`, `timetable: [{ subject, date, startTime, endTime, roomNo, maxMarks }]`.
   - Stores authoritative maximum marks ceiling per sessional exam.
3. **StudentProfile (`backend/src/models/StudentProfile.js`)**:
   - Comprehensive student demographics, enrollment number, roll number, father's name, admission category, and digital card QR payload.
4. **AttendanceSession & AttendanceRecord**:
   - Clean relational split between class session metadata and individual student present/absent records, preventing document bloat beyond MongoDB's 16MB BSON limit.

---

## 4. Backend Architectural Gaps & Vulnerabilities

1. **Simulated Payment Gateway**:
   - In `feeController.js`, `payFee` does not communicate with any external banking API:
     ```javascript
     // Actual implementation in feeController.js:
     const transactionId = 'TXN_' + crypto.randomBytes(8).toString('hex').toUpperCase();
     feeRecord.status = 'PAID';
     feeRecord.paymentDetails = { transactionId, method: req.body.paymentMethod || 'ONLINE' };
     await feeRecord.save();
     ```
   - **Architectural Fix**: Replace with Razorpay order creation (`orders.create`) and server-side HMAC-SHA256 signature verification in webhook callback.
2. **Missing Multi-Document ACID Transactions**:
   - Bulk marks entry in `academicController.js` executes sequential `findOneAndUpdate` calls in a loop without using `mongoose.startSession()` and `session.withTransaction()`. A network disconnect mid-batch could leave half a class updated.
3. **Lack of Distributed Cache (Redis)**:
   - High-frequency read queries like `GET /api/academic/exam-marks/ceiling` and `GET /api/timetable` hit MongoDB Atlas on every student page load. On result day, 5,000 concurrent students will saturate Atlas connection pools.
4. **File Storage on Local Filesystem**:
   - Uploaded lecture videos, notes PDFs, and assignment submissions are written directly to local disk (`uploads/`). This prevents horizontal scaling across multiple load-balanced container instances (ECS/Kubernetes) without a shared NFS volume.
