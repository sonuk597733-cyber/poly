import fs from 'fs';

// Helper to compute weighted score
function calcScore(ui, fe, be, db, sec, val, resp, prod) {
  const score = (
    (ui * 2.0) +
    (fe * 1.5) +
    (be * 2.0) +
    (db * 1.5) +
    (sec * 1.0) +
    (val * 0.75) +
    (resp * 0.5) +
    (prod * 0.75)
  ) / 10.0;
  return Number(score.toFixed(1));
}

// Complete list of all 226 ERP features across 9 modules
const features = [
  // ==========================================
  // MODULE A: PUBLIC WEBSITE (15)
  // ==========================================
  {
    module: "Public Website",
    feature: "Home page",
    ui: 9.0, fe: 9.0, be: 7.0, db: 7.0, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Hero slides, department bento, stats ticker, dynamic layout in Home.jsx (3263 lines)."
  },
  {
    module: "Public Website",
    feature: "About college",
    ui: 9.0, fe: 9.0, be: 6.0, db: 6.0, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Accreditation history, campus infrastructure, vision & mission with high visual polish."
  },
  {
    module: "Public Website",
    feature: "Principal and Director messages",
    ui: 8.5, fe: 8.5, be: 5.0, db: 5.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Rendered cleanly in UI; message text is hardcoded in frontend component."
  },
  {
    module: "Public Website",
    feature: "Courses and branches",
    ui: 9.0, fe: 9.0, be: 7.0, db: 7.0, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Department cards, intake quotas, curriculum syllabus viewer modal."
  },
  {
    module: "Public Website",
    feature: "Faculty introduction",
    ui: 8.5, fe: 8.0, be: 4.0, db: 4.0, sec: 6.0, val: 6.0, resp: 8.0, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "Faculty cards present with consultation modal; submit triggers browser alert()."
  },
  {
    module: "Public Website",
    feature: "Campus gallery",
    ui: 9.0, fe: 9.0, be: 6.0, db: 6.0, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Categorized photo gallery with lightbox modal viewer."
  },
  {
    module: "Public Website",
    feature: "Virtual campus tour",
    ui: 8.5, fe: 8.0, be: 3.0, db: 3.0, sec: 7.0, val: 6.0, resp: 7.5, prod: 5.5,
    status: "FRONTEND ONLY",
    notes: "360 hotspot modal UI present with simulated camera views; assets are static."
  },
  {
    module: "Public Website",
    feature: "Events and news",
    ui: 8.5, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Notice feed in Home.jsx; backend has Notice model and academic events API."
  },
  {
    module: "Public Website",
    feature: "Placement and recruiters",
    ui: 9.0, fe: 9.0, be: 7.5, db: 7.5, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Marquee ticker of corporate recruiters, placement stats, package charts."
  },
  {
    module: "Public Website",
    feature: "Achievements",
    ui: 8.5, fe: 8.5, be: 5.0, db: 5.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Awards, robotics competition showcase; content statically maintained."
  },
  {
    module: "Public Website",
    feature: "Contact page",
    ui: 9.0, fe: 8.5, be: 4.0, db: 4.0, sec: 7.0, val: 7.0, resp: 8.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Map location, address, direct telephone contacts; form lacks dedicated backend lead endpoint."
  },
  {
    module: "Public Website",
    feature: "Admission enquiry",
    ui: 8.5, fe: 7.0, be: 2.0, db: 2.0, sec: 5.0, val: 6.0, resp: 8.0, prod: 4.0,
    status: "FRONTEND ONLY",
    notes: "Modal enquiry form handles local state reset with setTimeout; does not POST to CRM/DB."
  },
  {
    module: "Public Website",
    feature: "Online admission",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 8.5, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Routed to #/register with cryptographic 6-digit email OTP verification."
  },
  {
    module: "Public Website",
    feature: "Brochure downloads",
    ui: 8.0, fe: 7.5, be: 3.0, db: 3.0, sec: 7.0, val: 6.0, resp: 8.0, prod: 5.0,
    status: "PARTIALLY WORKING",
    notes: "Download button triggers direct PDF fetch; requires static asset hosting."
  },
  {
    module: "Public Website",
    feature: "FAQ",
    ui: 9.0, fe: 9.0, be: 6.0, db: 6.0, sec: 8.0, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Interactive animated accordion FAQ with admissions, hostel, fee and diploma questions."
  },

  // ==========================================
  // MODULE B: STUDENT DASHBOARD (39)
  // ==========================================
  {
    module: "Student Dashboard",
    feature: "Student profile",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentProfile.jsx (470L) & components; profileController.js, StudentProfile.js."
  },
  {
    module: "Student Dashboard",
    feature: "Personal information",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Father/mother name, DOB, blood group, address, enrollment, verified against User & Profile."
  },
  {
    module: "Student Dashboard",
    feature: "Digital ID card",
    ui: 9.5, fe: 9.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "DigitalStudentCard.jsx (219L) 3D interactive flip card with Subharti branding, QR code, PNG/PDF export."
  },
  {
    module: "Student Dashboard",
    feature: "Academic dashboard",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 9.0, prod: 8.5,
    status: "FULLY WORKING",
    notes: "StudentDashboard.jsx (2858L) real KPI cards, quick actions, today attendance, schedule."
  },
  {
    module: "Student Dashboard",
    feature: "Attendance",
    ui: 9.5, fe: 9.0, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "StudentAttendance.jsx (986L); attendanceController.js, DailyCollegeAttendance.js."
  },
  {
    module: "Student Dashboard",
    feature: "Subject-wise attendance",
    ui: 9.5, fe: 9.0, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "StudentSubjectAttendance.jsx (1767L); SubjectAttendanceRecord.js, calculation engine."
  },
  {
    module: "Student Dashboard",
    feature: "Timetable",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentTimetable.jsx (771L); timetableController.js (/student-schedule & /published)."
  },
  {
    module: "Student Dashboard",
    feature: "Study materials",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Unified material browser across lecture notes, slides, and laboratory handouts."
  },
  {
    module: "Student Dashboard",
    feature: "Digital lectures",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "StudentLectures.jsx (2257L); Lecture.js, lectureController.js, progress persistence."
  },
  {
    module: "Student Dashboard",
    feature: "Video lectures",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "HTTP 206 Partial Content video streaming, custom controls, speed adjustment, watch milestones."
  },
  {
    module: "Student Dashboard",
    feature: "Notes and PDF downloads",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentNotes.jsx (1875L); Note.js, NoteDownload.js, preview & authenticated download."
  },
  {
    module: "Student Dashboard",
    feature: "Assignment creation/viewing",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentAssignments.jsx (1280L); Assignment.js, assignmentController.js."
  },
  {
    module: "Student Dashboard",
    feature: "Assignment submission",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "File attachment and rich solution submission with deadline enforcement."
  },
  {
    module: "Student Dashboard",
    feature: "Online examination",
    ui: 4.0, fe: 3.5, be: 2.0, db: 2.0, sec: 5.0, val: 4.0, resp: 5.0, prod: 3.0,
    status: "NOT IMPLEMENTED",
    notes: "No real-time MCQ/quiz examination test-taking engine with timer; offline sessional system used."
  },
  {
    module: "Student Dashboard",
    feature: "Exam schedule",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentExams.jsx (2097L); ExamSchedule.js, date filtering, paper timing, room assignment."
  },
  {
    module: "Student Dashboard",
    feature: "Admit card",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Official Subharti hall ticket in StudentExams with fee clearance check & print layout."
  },
  {
    module: "Student Dashboard",
    feature: "Results and marksheets",
    ui: 10.0, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.5, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "StudentResults.jsx (1476L); authentic Subharti Statement of Marks, hologram, signatures, modal."
  },
  {
    module: "Student Dashboard",
    feature: "Academic performance",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "3-Sessional Best-of-Three engine, SGPA, total credit points, percentage gauges."
  },
  {
    module: "Student Dashboard",
    feature: "Fee details",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "StudentFees.jsx (789L); FeeRecord.js, breakdown by tuition, lab, library, exam fee."
  },
  {
    module: "Student Dashboard",
    feature: "Online fee payment",
    ui: 8.5, fe: 8.0, be: 6.0, db: 6.0, sec: 7.0, val: 7.0, resp: 8.0, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "Internal ledger payment simulation; lacks Razorpay/Paytm real payment gateway webhook integration."
  },
  {
    module: "Student Dashboard",
    feature: "Fee receipts",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Official digital receipt with transaction ID, payment channel, stamp and print styling."
  },
  {
    module: "Student Dashboard",
    feature: "Due fee reminders",
    ui: 8.5, fe: 8.0, be: 6.0, db: 6.0, sec: 7.5, val: 7.0, resp: 8.0, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "In-app banner warning for pending dues; automated SMS/WhatsApp reminders not connected."
  },
  {
    module: "Student Dashboard",
    feature: "Leave applications",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "StudentLeaves.jsx (2087L); LeaveApplication.js, medical/casual request form."
  },
  {
    module: "Student Dashboard",
    feature: "Leave tracking",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Multi-level approval queue tracking (pending, approved, rejected) with coordinator/HOD remarks."
  },
  {
    module: "Student Dashboard",
    feature: "Library",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "StudentLibrary.jsx (502L); LibraryBook.js, BookIssue.js, catalog search."
  },
  {
    module: "Student Dashboard",
    feature: "Book issue and return",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Direct issue request and book return action with due date tracking."
  },
  {
    module: "Student Dashboard",
    feature: "Notices",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "StudentNotices.jsx (319L); Notice.js, category filter (academic, exam, sports, circulars)."
  },
  {
    module: "Student Dashboard",
    feature: "Complaints and feedback",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "StudentFeedback.jsx (363L); Feedback.js, faculty teaching feedback submission."
  },
  {
    module: "Student Dashboard",
    feature: "Personal messaging",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No direct 1:1 chat or websocket messaging backend implemented."
  },
  {
    module: "Student Dashboard",
    feature: "Group discussion",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No class group forum or peer-to-peer discussion channel."
  },
  {
    module: "Student Dashboard",
    feature: "Notifications",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "StudentNotifications.jsx (279L); Notification.js, mark read, unread count."
  },
  {
    module: "Student Dashboard",
    feature: "Certificates",
    ui: 8.5, fe: 8.0, be: 6.0, db: 6.0, sec: 7.5, val: 7.0, resp: 8.0, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Certifications showcase in StudentProfile; automated bona fide / character certificate generator absent."
  },
  {
    module: "Student Dashboard",
    feature: "Documents",
    ui: 8.5, fe: 8.0, be: 7.0, db: 7.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Document uploads handled via profile, assignment, lecture materials; lack central digital locker."
  },
  {
    module: "Student Dashboard",
    feature: "Placement and internship",
    ui: 8.5, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Placement stats in Home and HODPlacements; student direct application portal not wired."
  },
  {
    module: "Student Dashboard",
    feature: "Event registration",
    ui: 7.5, fe: 7.0, be: 6.0, db: 6.0, sec: 7.0, val: 6.5, resp: 7.5, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "Academic calendar events visible; dedicated student 1-click RSVP registration missing."
  },
  {
    module: "Student Dashboard",
    feature: "Hostel",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No hostel room allocation, mess management, or hostel fee tracking."
  },
  {
    module: "Student Dashboard",
    feature: "Transport",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No bus route tracking, transport fee, or driver allocation."
  },
  {
    module: "Student Dashboard",
    feature: "Help and support",
    ui: 8.5, fe: 8.0, be: 6.0, db: 6.0, sec: 7.5, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "StudentFeedback.jsx handles support tickets; lacks real-time helpdesk live chat."
  },
  {
    module: "Student Dashboard",
    feature: "Activity history",
    ui: 9.0, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Activity timeline in StudentProfile with lecture watches, assignment submissions."
  },

  // ==========================================
  // MODULE C: TEACHER / FACULTY DASHBOARD (27)
  // ==========================================
  {
    module: "Teacher Dashboard",
    feature: "Faculty profile",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "TeacherProfile.jsx (320L); TeacherProfile.js, qualification, department, photo."
  },
  {
    module: "Teacher Dashboard",
    feature: "My classes",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "TeacherClasses.jsx (169L); assigned sections, rooms, student counts."
  },
  {
    module: "Teacher Dashboard",
    feature: "My subjects",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Subject allocations filtered by assignedTeacherId in Subject.js."
  },
  {
    module: "Teacher Dashboard",
    feature: "Timetable",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "TeacherTimetable.jsx (337L); /api/timetable/teacher-schedule personal teaching schedule."
  },
  {
    module: "Teacher Dashboard",
    feature: "Student list",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "TeacherStudents.jsx (177L); class roster, branch filters, student cards."
  },
  {
    module: "Teacher Dashboard",
    feature: "Student profiles",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Deep-link to StudentPublicProfile.jsx with comprehensive academic portfolio."
  },
  {
    module: "Teacher Dashboard",
    feature: "Attendance management",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "MasterAttendanceStudio.jsx (1265L); roll call, present/absent/late, bulk actions."
  },
  {
    module: "Teacher Dashboard",
    feature: "Bulk attendance",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Mark All Present, Mark All Absent, Invert Selection, bulk submit."
  },
  {
    module: "Teacher Dashboard",
    feature: "Attendance reports",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "TeachingAttendanceCalendar.jsx (700L); monthly grid, session compliance."
  },
  {
    module: "Teacher Dashboard",
    feature: "Lecture upload",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "TeacherLectures.jsx (2839L); multi-part metadata, thumbnail, handout attachments."
  },
  {
    module: "Teacher Dashboard",
    feature: "Video upload",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Resumable chunked upload (/upload/init, /upload/chunk, /upload/complete) up to 600 MB."
  },
  {
    module: "Teacher Dashboard",
    feature: "Notes upload",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "TeacherNotes.jsx (2800L); noteUpload middleware, PDF validation, multi-file attachments."
  },
  {
    module: "Teacher Dashboard",
    feature: "Study material upload",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Material.js, createMaterial controller, branch/year/sem categorisation."
  },
  {
    module: "Teacher Dashboard",
    feature: "Lecture analytics",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Total views, completion rate, average watch duration, drop-off curve."
  },
  {
    module: "Teacher Dashboard",
    feature: "Individual student watch tracking",
    ui: 9.5, fe: 9.0, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Per-candidate watch percent, last viewed timestamp in LectureProgress.js."
  },
  {
    module: "Teacher Dashboard",
    feature: "Assignment creation",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "TeacherAssignments.jsx (2738L); rich prompt, reference files, due dates, rubric."
  },
  {
    module: "Teacher Dashboard",
    feature: "Assignment checking",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "TeacherSubmissions.jsx (329L); evaluateSubmission controller, grade, remarks."
  },
  {
    module: "Teacher Dashboard",
    feature: "Marks entry",
    ui: 10.0, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.5, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "TeacherMarks.jsx (1780L); One-Time Maximum Marks configuration, cohort spreadsheet, live KPIs."
  },
  {
    module: "Teacher Dashboard",
    feature: "Examination management",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "3-Sessional exam workflows, draft / submit batch for coordinator verification."
  },
  {
    module: "Teacher Dashboard",
    feature: "Internal assessment",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Best-of-Three calculation matrix, remedial/distinction tags, batch persistence."
  },
  {
    module: "Teacher Dashboard",
    feature: "Student performance",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Class distribution curves (5 bands), top performers leaderboard, improvement rates."
  },
  {
    module: "Teacher Dashboard",
    feature: "Leave applications",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "TeacherLeaves.jsx (321L); submit duty leave, medical leave, check approval status."
  },
  {
    module: "Teacher Dashboard",
    feature: "Student communication",
    ui: 8.0, fe: 7.5, be: 6.0, db: 6.0, sec: 7.5, val: 7.0, resp: 8.0, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Notices broadcast implemented; real-time individual messaging absent."
  },
  {
    module: "Teacher Dashboard",
    feature: "Notices",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "TeacherNotices.jsx (277L); create Notice targeted to specific branch/semester."
  },
  {
    module: "Teacher Dashboard",
    feature: "Class announcements",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Broadcast announcement banner with priority tagging (urgent/normal)."
  },
  {
    module: "Teacher Dashboard",
    feature: "Doubt management",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No dedicated student doubt asking & answer ticketing system."
  },
  {
    module: "Teacher Dashboard",
    feature: "Faculty work reports",
    ui: 8.0, fe: 8.0, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "TeacherReports.jsx (245L); overview metrics; export to PDF uses browser print."
  },

  // ==========================================
  // MODULE D: COORDINATOR DASHBOARD (21)
  // ==========================================
  {
    module: "Coordinator Dashboard",
    feature: "Coordinator overview",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "CoordinatorDashboard.jsx (271L); academic planning KPIs, pending task counters."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Branch management",
    ui: 7.5, fe: 7.0, be: 6.0, db: 6.0, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Filter scope by branch; branch creation/editing delegated to HOD/Admin."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Semester management",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Semester cohort filters across timetable, exams and assignments."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Section management",
    ui: 7.5, fe: 7.0, be: 6.5, db: 6.5, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Section A/B division in attendance config; lacks dynamic section CRUD."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Student management",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "CoordinatorStudents.jsx (172L); directory inspection and public profile view."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Faculty management",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "CoordinatorFaculty.jsx (182L); staff list, availability, subject mapping."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Subject allocation",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Subject-to-faculty mapping in CoordinatorTimetable.jsx and Subject.js."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Timetable management",
    ui: 10.0, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.5, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "CoordinatorTimetable.jsx (3217L); AI generation, OCR photo extraction, room constraints, conflicts."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Attendance monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "CoordinatorAttendance.jsx embeds Master Studio with department cohort filters."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Low attendance alerts",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Defaulter detection threshold (under 75%) in /api/attendance/analytics."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Assignment monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "CoordinatorAssignments.jsx (724L); monitor all staff assignments, download CSV."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Lecture monitoring",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Overview of published lectures, duration, and student watch analytics."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Examination coordination",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "CoordinatorExams.jsx (549L); Level 1 marks verification & rejection workflow."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Result monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Track exam mark workflow state across draft, submitted, verified, approved."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Student complaints",
    ui: 8.0, fe: 7.5, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Feedback review in CoordinatorApprovals; lacks separate grievance ticketing."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Faculty performance",
    ui: 8.5, fe: 8.0, be: 7.5, db: 7.5, sec: 8.5, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Staff syllabus progress and lecture count; automated KPI scorecard in progress."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Academic calendar",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "CoordinatorCalendar.jsx (255L); AcademicEvent.js, semester milestones."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Notices",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "CoordinatorNotices.jsx (210L); broadcast to department cohort."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Leave approvals",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "CoordinatorLeaves.jsx (168L); Level 1 sanction of student/staff leaves."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Department reports",
    ui: 8.0, fe: 8.0, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "CoordinatorReports.jsx (128L); summary tables, print export."
  },
  {
    module: "Coordinator Dashboard",
    feature: "Student progress reports",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "StudentDirectory and profile inspection with cumulative metrics."
  },

  // ==========================================
  // MODULE E: HOD DASHBOARD (25)
  // ==========================================
  {
    module: "HOD Dashboard",
    feature: "Department overview",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODDashboard.jsx (1165L); department metrics, enrollment, attendance rate."
  },
  {
    module: "HOD Dashboard",
    feature: "Department analytics",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Recharts graphs for attendance trends, sessional distributions, staff loads."
  },
  {
    module: "HOD Dashboard",
    feature: "Student management",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODStudents.jsx (3113L); deep student ledger, academic standing, suspension actions."
  },
  {
    module: "HOD Dashboard",
    feature: "Faculty management",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODTeachers.jsx (2539L); workload allocations, teaching slots, leave oversight."
  },
  {
    module: "HOD Dashboard",
    feature: "Faculty allocation",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Direct faculty-to-slot and subject assignments with conflict checking."
  },
  {
    module: "HOD Dashboard",
    feature: "Subject allocation",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODAcademicManagement.jsx (1405L); full Subject CRUD with teacher assignment."
  },
  {
    module: "HOD Dashboard",
    feature: "Semester management",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Semester cohort filtering across 6 academic terms."
  },
  {
    module: "HOD Dashboard",
    feature: "Timetable approval",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "HODTimetable.jsx (671L); approve and publish master department schedule."
  },
  {
    module: "HOD Dashboard",
    feature: "Attendance monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODAttendance.jsx embeds studio with cross-faculty session inspections."
  },
  {
    module: "HOD Dashboard",
    feature: "Attendance defaulter list",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Automated aggregation of candidates below statutory 75% cutoff."
  },
  {
    module: "HOD Dashboard",
    feature: "Lecture monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODMaterials.jsx (1118L); lecture stream previews, syllabus completion audit."
  },
  {
    module: "HOD Dashboard",
    feature: "Study material monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Notes, handouts, laboratory manuals upload and download tracking."
  },
  {
    module: "HOD Dashboard",
    feature: "Assignment monitoring",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODAssignments.jsx (1364L); department assignment stats, due dates, submission rates."
  },
  {
    module: "HOD Dashboard",
    feature: "Examination management",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "HODExaminations.jsx (1235L); ExamSchedule CRUD, exam analytics."
  },
  {
    module: "HOD Dashboard",
    feature: "Internal marks approval",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "HODResults.jsx (611L); Level 2 approval / rejection of sessional & exam marks."
  },
  {
    module: "HOD Dashboard",
    feature: "Result analysis",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Subject-wise pass percentages, distinction counters, back-paper analysis."
  },
  {
    module: "HOD Dashboard",
    feature: "Faculty performance",
    ui: 9.0, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Teaching hour audits, syllabus unit completion trackers."
  },
  {
    module: "HOD Dashboard",
    feature: "Faculty leave approval",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODLeaves.jsx (281L); approve / reject faculty applications with comments."
  },
  {
    module: "HOD Dashboard",
    feature: "Student leave approval",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Approve student leaves and adjust biometric attendance shortfall reasons."
  },
  {
    module: "HOD Dashboard",
    feature: "Department notices",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "HODNotices.jsx (234L); broadcast urgent department circulars."
  },
  {
    module: "HOD Dashboard",
    feature: "Department events",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "HODEvents.jsx (933L); AcademicEvent.js, technical symposium, workshops."
  },
  {
    module: "HOD Dashboard",
    feature: "Complaints management",
    ui: 8.0, fe: 7.5, be: 7.5, db: 7.5, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Feedback.js respondFeedback endpoint available; lacks formal escalation SLA queue."
  },
  {
    module: "HOD Dashboard",
    feature: "Department budget",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No financial department budget ledger or purchase request approval engine."
  },
  {
    module: "HOD Dashboard",
    feature: "Department reports",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "HODReports.jsx (672L); accreditation summaries, class strength charts."
  },
  {
    module: "HOD Dashboard",
    feature: "Coordinator management",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "View and inspect coordinator accounts in directory; dynamic coordinator reassignment absent."
  },

  // ==========================================
  // MODULE F: PRINCIPAL DASHBOARD (24)
  // ==========================================
  {
    module: "Principal Dashboard",
    feature: "College overview",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "PrincipalDashboard.jsx (271L); high-level campus KPI bento grid."
  },
  {
    module: "Principal Dashboard",
    feature: "Student analytics",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Campus enrollment headcount, gender ratio, branch distribution."
  },
  {
    module: "Principal Dashboard",
    feature: "Faculty analytics",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "PrincipalFaculty.jsx (138L); total faculty count, designation distribution."
  },
  {
    module: "Principal Dashboard",
    feature: "Branch-wise reports",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Comparison of CSE, ME, EE, Civil, ECE performance."
  },
  {
    module: "Principal Dashboard",
    feature: "Semester-wise reports",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Semester cohort filters across principal analytics."
  },
  {
    module: "Principal Dashboard",
    feature: "Admission analytics",
    ui: 7.5, fe: 7.0, be: 6.0, db: 6.0, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "Calculated from User.role='student'; separate admission inquiry funnel analytics absent."
  },
  {
    module: "Principal Dashboard",
    feature: "Fee collection analytics",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Total collected vs pending fees aggregated from FeeRecord.js."
  },
  {
    module: "Principal Dashboard",
    feature: "Attendance analytics",
    ui: 9.0, fe: 8.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "College-wide daily attendance averages and branch shortage summaries."
  },
  {
    module: "Principal Dashboard",
    feature: "Examination analytics",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "PrincipalExams.jsx (417L); exam schedule tracking, batch readiness."
  },
  {
    module: "Principal Dashboard",
    feature: "Result analytics",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Level 3 final executive marks sanction (sanctionExamMarksPrincipal)."
  },
  {
    module: "Principal Dashboard",
    feature: "Placement analytics",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Placement statistics in PrincipalReports via /api/academic/placements/stats."
  },
  {
    module: "Principal Dashboard",
    feature: "Faculty performance",
    ui: 8.0, fe: 7.5, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Faculty overview tables; individual staff performance appraisals not digitized."
  },
  {
    module: "Principal Dashboard",
    feature: "Department performance",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Department cards with student strength, faculty ratio, lab assets."
  },
  {
    module: "Principal Dashboard",
    feature: "HOD management",
    ui: 8.0, fe: 7.5, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "HOD accounts viewable in user directory; administrative assignment workflow manual."
  },
  {
    module: "Principal Dashboard",
    feature: "Staff management",
    ui: 8.0, fe: 7.5, be: 7.5, db: 7.5, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Teaching staff overview; non-teaching administrative staff accounts limited."
  },
  {
    module: "Principal Dashboard",
    feature: "College-wide notices",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "PrincipalNotices.jsx (215L); executive orders & college notices broadcast."
  },
  {
    module: "Principal Dashboard",
    feature: "Leave approvals",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "PrincipalApprovals.jsx (162L); final executive approval of staff and student leaves."
  },
  {
    module: "Principal Dashboard",
    feature: "Complaints monitoring",
    ui: 7.5, fe: 7.0, be: 7.0, db: 7.0, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Campus feedback accessible; lacks formal ombudsman grievance workflow."
  },
  {
    module: "Principal Dashboard",
    feature: "College events",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Academic calendar milestones, graduation, sports day tracking."
  },
  {
    module: "Principal Dashboard",
    feature: "Academic calendar",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Institutional term calendar view in Principal Timetable & Calendar."
  },
  {
    module: "Principal Dashboard",
    feature: "Budget and expenses",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No financial expense tracking or capital expenditure ledger."
  },
  {
    module: "Principal Dashboard",
    feature: "Infrastructure reports",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "LabEquipment.js and CampusRoom.js metrics reflected in reports."
  },
  {
    module: "Principal Dashboard",
    feature: "Management reports",
    ui: 8.0, fe: 8.0, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "PrincipalReports.jsx (101L); print view; PDF generator service absent."
  },
  {
    module: "Principal Dashboard",
    feature: "College performance reports",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "High-level summary cards; AI-generated periodic executive summaries absent."
  },

  // ==========================================
  // MODULE G: ADMIN / SUPER ADMIN (38)
  // ==========================================
  {
    module: "Admin",
    feature: "System overview",
    ui: 8.5, fe: 8.5, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "AdminDashboard.jsx (210L); server health, MongoDB state, active users."
  },
  {
    module: "Admin",
    feature: "Multi-branch management",
    ui: 6.0, fe: 5.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 7.0, prod: 4.0,
    status: "PLACEHOLDER / HARDCODED",
    notes: "AdminBranches.jsx (62L) contains hardcoded DEPARTMENTS array; no dynamic branch CRUD."
  },
  {
    module: "Admin",
    feature: "Campus management",
    ui: 6.0, fe: 5.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 7.0, prod: 4.0,
    status: "PLACEHOLDER / HARDCODED",
    notes: "Campus configuration statically referenced as Subharti Polytechnic."
  },
  {
    module: "Admin",
    feature: "Department management",
    ui: 6.0, fe: 5.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 7.0, prod: 4.0,
    status: "PLACEHOLDER / HARDCODED",
    notes: "AdminBranches table is static; HOD has Subject CRUD, but Admin lacks Department model CRUD."
  },
  {
    module: "Admin",
    feature: "Course management",
    ui: 7.0, fe: 6.5, be: 6.0, db: 6.0, sec: 7.0, val: 6.0, resp: 7.5, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "Subjects managed under HODAcademicManagement; standalone Course degree entity absent."
  },
  {
    module: "Admin",
    feature: "Semester and section management",
    ui: 7.5, fe: 7.0, be: 7.0, db: 7.0, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Semesters 1-6 enum supported; section division supported in attendance config."
  },
  {
    module: "Admin",
    feature: "User management",
    ui: 9.0, fe: 8.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "AdminUsers.jsx (205L); search by name/email/role, active/inactive toggles."
  },
  {
    module: "Admin",
    feature: "Student management",
    ui: 9.0, fe: 8.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Filter students in AdminUsers and inspect details via StudentsDirectory."
  },
  {
    module: "Admin",
    feature: "Faculty management",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Filter faculty in AdminUsers and manage access states."
  },
  {
    module: "Admin",
    feature: "Staff management",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Coordinators, HODs and Principals listed in User collection."
  },
  {
    module: "Admin",
    feature: "Role management",
    ui: 6.0, fe: 5.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 7.0, prod: 4.0,
    status: "PLACEHOLDER / HARDCODED",
    notes: "AdminRoles.jsx (141L) is a static informational table; lacks dynamic role/permission editor."
  },
  {
    module: "Admin",
    feature: "Permission management",
    ui: 6.0, fe: 5.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 7.0, prod: 4.0,
    status: "PLACEHOLDER / HARDCODED",
    notes: "Permissions are hardcoded in Express authorize() middleware, not configurable from UI."
  },
  {
    module: "Admin",
    feature: "RBAC",
    ui: 9.0, fe: 9.0, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Strict server-side RBAC with 6 roles enforced across 102 backend endpoints."
  },
  {
    module: "Admin",
    feature: "Admission management",
    ui: 7.5, fe: 7.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.0, resp: 7.5, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Pending registration approvals supported; admission inquiry lead funnel absent."
  },
  {
    module: "Admin",
    feature: "Fee structure",
    ui: 7.0, fe: 6.5, be: 6.0, db: 6.0, sec: 7.5, val: 6.0, resp: 7.5, prod: 6.0,
    status: "PARTIALLY WORKING",
    notes: "FeeRecord.js stores fee amounts; admin UI to dynamically configure fee heads per branch absent."
  },
  {
    module: "Admin",
    feature: "Payment management",
    ui: 8.0, fe: 7.5, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 8.0, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Payment records audited in database; payment gateway refund/reconciliation absent."
  },
  {
    module: "Admin",
    feature: "Scholarship management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No scholarship application, verification or fee discount disbursement module."
  },
  {
    module: "Admin",
    feature: "Attendance configuration",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "AcademicAttendanceConfig.js; configure mode (daily vs subject), thresholds, grace rules."
  },
  {
    module: "Admin",
    feature: "Examination configuration",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "AdminExams.jsx; pass marks, grace mark policy, back-paper eligibility ordinance settings."
  },
  {
    module: "Admin",
    feature: "Result management",
    ui: 10.0, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.5, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "AdminExams.jsx; semester result calculation, publication lock, gazette generation, post-pub corrections."
  },
  {
    module: "Admin",
    feature: "Timetable configuration",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "TimetableConfig.js; working days, period timings, lunch breaks, max consecutive hours."
  },
  {
    module: "Admin",
    feature: "Library management",
    ui: 8.5, fe: 8.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "LibraryBook.js, BookIssue.js, book inventory, issue limits."
  },
  {
    module: "Admin",
    feature: "Hostel management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No hostel buildings, room inventory, or student allocation engine."
  },
  {
    module: "Admin",
    feature: "Transport management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No transport fleet, bus passes, or route management."
  },
  {
    module: "Admin",
    feature: "Inventory management",
    ui: 8.0, fe: 7.5, be: 8.0, db: 8.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "LabEquipment.js handles laboratory equipment; general campus store inventory absent."
  },
  {
    module: "Admin",
    feature: "Payroll management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No staff salary structures, payslip generation, deductions, or payroll processing."
  },
  {
    module: "Admin",
    feature: "HR management",
    ui: 7.5, fe: 7.0, be: 7.0, db: 7.0, sec: 7.5, val: 7.0, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Faculty profile and leave records supported; employee onboarding / appraisals absent."
  },
  {
    module: "Admin",
    feature: "Reports and analytics",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "AdminReports.jsx (98L); database document counts across users, exams, attendance."
  },
  {
    module: "Admin",
    feature: "Audit logs",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "AdminAudit.jsx (113L); AuditLog.js, tracks security actions, timestamps, actor IDs, IP."
  },
  {
    module: "Admin",
    feature: "Activity logs",
    ui: 9.0, fe: 8.5, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "Action triggers logged in AuditLog collection."
  },
  {
    module: "Admin",
    feature: "Backup and restore",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No 1-click database mongodump / mongorestore backup UI in admin dashboard."
  },
  {
    module: "Admin",
    feature: "System settings",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "AdminSettings.jsx (151L); SystemSetting.js, key-value configuration."
  },
  {
    module: "Admin",
    feature: "Email configuration",
    ui: 8.0, fe: 7.5, be: 8.0, db: 8.0, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "emailService.js nodemailer SMTP transport configured in backend/.env."
  },
  {
    module: "Admin",
    feature: "SMS configuration",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No SMS gateway provider (Twilio / Msg91) credentials or service."
  },
  {
    module: "Admin",
    feature: "WhatsApp integration",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No WhatsApp Business API webhook or notification service."
  },
  {
    module: "Admin",
    feature: "Notification settings",
    ui: 8.0, fe: 8.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.0, prod: 7.5,
    status: "FULLY WORKING",
    notes: "Broadcast channels and notification categories managed."
  },
  {
    module: "Admin",
    feature: "API management",
    ui: 7.5, fe: 7.0, be: 7.0, db: 7.0, sec: 8.0, val: 7.0, resp: 7.5, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "Healthcheck and rate limiting configured; external API key token management absent."
  },
  {
    module: "Admin",
    feature: "Security management",
    ui: 9.0, fe: 8.5, be: 9.0, db: 9.0, sec: 9.5, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Security headers (Helmet), CORS origin whitelist, CSRF origin verification, bcrypt hashing."
  },

  // ==========================================
  // MODULE H: COMMON ADVANCED SYSTEMS (19)
  // ==========================================
  {
    module: "Common Advanced Systems",
    feature: "In-app notifications",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Notification.js, mark read / mark all read across student, faculty and admin."
  },
  {
    module: "Common Advanced Systems",
    feature: "Email notifications",
    ui: 8.0, fe: 7.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "emailService.js dispatches OTP codes and password recovery emails via nodemailer."
  },
  {
    module: "Common Advanced Systems",
    feature: "SMS notifications",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No SMS gateway integrated."
  },
  {
    module: "Common Advanced Systems",
    feature: "WhatsApp notifications",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No WhatsApp Cloud API integrated."
  },
  {
    module: "Common Advanced Systems",
    feature: "Personal messaging",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No 1:1 direct chat module."
  },
  {
    module: "Common Advanced Systems",
    feature: "Group messaging",
    ui: 2.0, fe: 2.0, be: 1.0, db: 1.0, sec: 2.0, val: 2.0, resp: 2.0, prod: 1.0,
    status: "NOT IMPLEMENTED",
    notes: "No group chat or discussion threads."
  },
  {
    module: "Common Advanced Systems",
    feature: "Calendar",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "AcademicEvent.js, CoordinatorCalendar.jsx, TeachingAttendanceCalendar.jsx."
  },
  {
    module: "Common Advanced Systems",
    feature: "Document management",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Lectures, notes, assignments, syllabi documents handled with path traversal defense."
  },
  {
    module: "Common Advanced Systems",
    feature: "Global search",
    ui: 8.5, fe: 8.5, be: 7.5, db: 7.5, sec: 8.0, val: 7.5, resp: 8.5, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Command+K search bar in DashboardLayout; module-level search filters across tables."
  },
  {
    module: "Common Advanced Systems",
    feature: "Analytics",
    ui: 9.5, fe: 9.5, be: 9.0, db: 9.0, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.0,
    status: "FULLY WORKING",
    notes: "Recharts bento widgets, attendance trends, sessional score distribution."
  },
  {
    module: "Common Advanced Systems",
    feature: "Export to PDF",
    ui: 9.0, fe: 8.5, be: 6.0, db: 6.0, sec: 8.0, val: 7.0, resp: 8.5, prod: 7.5,
    status: "PARTIALLY WORKING",
    notes: "Formatted CSS @media print A4 printable sheets (marksheets, fee receipts, reports); backend headless Puppeteer PDF absent."
  },
  {
    module: "Common Advanced Systems",
    feature: "Export to Excel",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.5,
    status: "FULLY WORKING",
    notes: "exportAssignmentReportCSV, exportAttendanceReport, CSV download handlers."
  },
  {
    module: "Common Advanced Systems",
    feature: "Security management",
    ui: 9.0, fe: 9.0, be: 9.5, db: 9.5, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Helmet security headers, strict CORS, passwordChangedAt validation, bcrypt."
  },
  {
    module: "Common Advanced Systems",
    feature: "Login history",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Recorded in AuditLog on user login events."
  },
  {
    module: "Common Advanced Systems",
    feature: "Audit trails",
    ui: 9.5, fe: 9.0, be: 9.0, db: 9.0, sec: 9.5, val: 9.0, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "AuditLog.js stores performerName, role, IP address, resource ID, action timestamp."
  },
  {
    module: "Common Advanced Systems",
    feature: "Automated reminders",
    ui: 5.0, fe: 5.0, be: 4.0, db: 4.0, sec: 6.0, val: 5.0, resp: 6.0, prod: 4.5,
    status: "PARTIALLY WORKING",
    notes: "In-app notifications trigger on assignment creation; automated cron daemon reminders absent."
  },
  {
    module: "Common Advanced Systems",
    feature: "Scheduled tasks",
    ui: 3.0, fe: 2.0, be: 3.0, db: 3.0, sec: 5.0, val: 4.0, resp: 4.0, prod: 3.0,
    status: "NOT IMPLEMENTED",
    notes: "No node-cron background task scheduler configured in backend."
  },
  {
    module: "Common Advanced Systems",
    feature: "Mobile responsive experience",
    ui: 9.5, fe: 9.0, be: 8.5, db: 8.5, sec: 9.0, val: 8.5, resp: 9.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "MobileBottomNavigation, 375px/390px/430px responsive CSS, mobile drawer navigation."
  },
  {
    module: "Common Advanced Systems",
    feature: "Third-party integrations",
    ui: 7.5, fe: 7.0, be: 7.5, db: 7.5, sec: 8.0, val: 7.0, resp: 7.5, prod: 7.0,
    status: "PARTIALLY WORKING",
    notes: "ImageKit CDN and Nodemailer SMTP configured; payment/SMS gateways absent."
  },

  // ==========================================
  // MODULE I: ENTERPRISE MODULES (18)
  // ==========================================
  {
    module: "Enterprise Modules",
    feature: "Admission CRM",
    ui: 4.0, fe: 3.5, be: 2.0, db: 2.0, sec: 4.0, val: 3.0, resp: 5.0, prod: 2.5,
    status: "NOT IMPLEMENTED",
    notes: "No lead tracking, counselor follow-ups, or admission funnel pipeline."
  },
  {
    module: "Enterprise Modules",
    feature: "Fees and accounting",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "FeeRecord.js, ledger balances, receipt generation, dues computation."
  },
  {
    module: "Enterprise Modules",
    feature: "Scholarships",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No scholarship disbursement or fee waiver approval engine."
  },
  {
    module: "Enterprise Modules",
    feature: "Library and e-library",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "LibraryBook.js, BookIssue.js, catalog search, book issue and return."
  },
  {
    module: "Enterprise Modules",
    feature: "Hostel and room allocation",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No hostel management module."
  },
  {
    module: "Enterprise Modules",
    feature: "Transport and vehicle management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No campus transport module."
  },
  {
    module: "Enterprise Modules",
    feature: "Placement and internship",
    ui: 9.0, fe: 9.0, be: 8.5, db: 8.5, sec: 8.5, val: 8.5, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "PlacementRecord.js, HODPlacements.jsx (1170L), company drives, CTC stats."
  },
  {
    module: "Enterprise Modules",
    feature: "Alumni management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No alumni network, directory, or reunion portal."
  },
  {
    module: "Enterprise Modules",
    feature: "HR and payroll",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No staff payroll, salary slips, or tax deduction computation."
  },
  {
    module: "Enterprise Modules",
    feature: "Inventory and assets",
    ui: 8.5, fe: 8.5, be: 8.5, db: 8.5, sec: 8.5, val: 8.0, resp: 8.5, prod: 8.5,
    status: "FULLY WORKING",
    notes: "LabEquipment.js, HODLaboratory.jsx (1164L); equipment serial numbers, maintenance status."
  },
  {
    module: "Enterprise Modules",
    feature: "Event management",
    ui: 9.0, fe: 9.0, be: 9.0, db: 9.0, sec: 9.0, val: 8.5, resp: 8.5, prod: 9.0,
    status: "FULLY WORKING",
    notes: "AcademicEvent.js, HODEvents.jsx (933L); event dates, venues, categories."
  },
  {
    module: "Enterprise Modules",
    feature: "Visitor management",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No campus gate visitor pass or check-in system."
  },
  {
    module: "Enterprise Modules",
    feature: "Grievance management",
    ui: 7.5, fe: 7.0, be: 7.0, db: 7.0, sec: 7.5, val: 6.5, resp: 7.5, prod: 6.5,
    status: "PARTIALLY WORKING",
    notes: "Feedback.js supports submissions & responses; dedicated multi-stage grievance workflow absent."
  },
  {
    module: "Enterprise Modules",
    feature: "Parent portal",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No parent login role or guardian SMS alert integration."
  },
  {
    module: "Enterprise Modules",
    feature: "Certificate generation",
    ui: 7.0, fe: 6.5, be: 5.0, db: 5.0, sec: 7.0, val: 6.0, resp: 7.0, prod: 5.5,
    status: "PARTIALLY WORKING",
    notes: "Official marksheets and hall tickets generate with security seals; transfer / bona fide certificate generators absent."
  },
  {
    module: "Enterprise Modules",
    feature: "Document verification",
    ui: 8.5, fe: 8.0, be: 8.0, db: 8.0, sec: 8.5, val: 8.0, resp: 8.0, prod: 8.0,
    status: "FULLY WORKING",
    notes: "Scanned marksheet modal viewer with zoom/pan and official university verification watermark."
  },
  {
    module: "Enterprise Modules",
    feature: "Learning Management System",
    ui: 9.5, fe: 9.5, be: 9.5, db: 9.5, sec: 9.0, val: 9.0, resp: 9.0, prod: 9.5,
    status: "FULLY WORKING",
    notes: "Full LMS: chunked video streaming, study notes, assignments, grading, watch analytics."
  },
  {
    module: "Enterprise Modules",
    feature: "AI academic assistant",
    ui: 1.0, fe: 1.0, be: 0.0, db: 0.0, sec: 1.0, val: 1.0, resp: 1.0, prod: 0.0,
    status: "NOT IMPLEMENTED",
    notes: "No LLM / Gemini academic bot integrated into student or faculty workspaces."
  }
];

// Calculate scores for all features
const enriched = features.map((f, i) => {
  const overall = calcScore(f.ui, f.fe, f.be, f.db, f.sec, f.val, f.resp, f.prod);
  return {
    id: i + 1,
    ...f,
    overall
  };
});

// Generate CSV
const csvHeaders = "ID,Module,Feature,UI_UX,Frontend,Backend,API_DB,Security,Validation,Responsive,ProductionReadiness,OverallScore,Status,Notes\n";
const csvRows = enriched.map(f => 
  `"${f.id}","${f.module}","${f.feature}",${f.ui},${f.fe},${f.be},${f.db},${f.sec},${f.val},${f.resp},${f.prod},${f.overall},"${f.status}","${f.notes.replace(/"/g, '""')}"`
).join('\n');

fs.writeFileSync('CollegeOS_AUDIT_REPORT/FEATURE_SCORECARD.csv', csvHeaders + csvRows);
console.log(`Successfully generated FEATURE_SCORECARD.csv with ${enriched.length} features!`);

// Compute Module & System Averages
const moduleMap = {};
for (const f of enriched) {
  if (!moduleMap[f.module]) {
    moduleMap[f.module] = { count: 0, ui: 0, fe: 0, be: 0, db: 0, sec: 0, val: 0, resp: 0, prod: 0, overall: 0 };
  }
  const m = moduleMap[f.module];
  m.count++;
  m.ui += f.ui;
  m.fe += f.fe;
  m.be += f.be;
  m.db += f.db;
  m.sec += f.sec;
  m.val += f.val;
  m.resp += f.resp;
  m.prod += f.prod;
  m.overall += f.overall;
}

const summary = {};
let totalOverall = 0, totalUI = 0, totalFE = 0, totalBE = 0, totalDB = 0, totalSec = 0, totalResp = 0, totalProd = 0;

console.log('\n--- MODULE-WISE AUDIT SCORECARD ---');
for (const [mod, data] of Object.entries(moduleMap)) {
  const avgOverall = Number((data.overall / data.count).toFixed(2));
  const avgUI = Number((data.ui / data.count).toFixed(2));
  const avgFE = Number((data.fe / data.count).toFixed(2));
  const avgBE = Number((data.be / data.count).toFixed(2));
  const avgDB = Number((data.db / data.count).toFixed(2));
  const avgSec = Number((data.sec / data.count).toFixed(2));
  const avgResp = Number((data.resp / data.count).toFixed(2));
  const avgProd = Number((data.prod / data.count).toFixed(2));
  summary[mod] = { count: data.count, overall: avgOverall, ui: avgUI, fe: avgFE, be: avgBE, db: avgDB, sec: avgSec, resp: avgResp, prod: avgProd };
  console.log(`${mod.padEnd(26)} (${data.count} items): Overall=${avgOverall}/10 | UI=${avgUI} | FE=${avgFE} | BE=${avgBE} | DB=${avgDB} | Sec=${avgSec} | Prod=${avgProd}`);
  
  totalOverall += data.overall;
  totalUI += data.ui;
  totalFE += data.fe;
  totalBE += data.be;
  totalDB += data.db;
  totalSec += data.sec;
  totalResp += data.resp;
  totalProd += data.prod;
}

const N = enriched.length;
const grandSummary = {
  totalFeatures: N,
  overallProjectScore: Number((totalOverall / N).toFixed(2)),
  uiUxScore: Number((totalUI / N).toFixed(2)),
  frontendScore: Number((totalFE / N).toFixed(2)),
  backendScore: Number((totalBE / N).toFixed(2)),
  databaseScore: Number((totalDB / N).toFixed(2)),
  securityScore: Number((totalSec / N).toFixed(2)),
  responsiveScore: Number((totalResp / N).toFixed(2)),
  productionReadinessScore: Number((totalProd / N).toFixed(2)),
  modules: summary
};

fs.writeFileSync('CollegeOS_AUDIT_REPORT/audit_summary.json', JSON.stringify(grandSummary, null, 2));
console.log('\n--- GRAND AUDIT TOTALS ---');
console.log('Overall Project Score /10:', grandSummary.overallProjectScore);
console.log('UI/UX Score /10:', grandSummary.uiUxScore);
console.log('Frontend Score /10:', grandSummary.frontendScore);
console.log('Backend Score /10:', grandSummary.backendScore);
console.log('Database Score /10:', grandSummary.databaseScore);
console.log('Security Score /10:', grandSummary.securityScore);
console.log('Responsive Design Score /10:', grandSummary.responsiveScore);
console.log('Production Readiness Score /10:', grandSummary.productionReadinessScore);
