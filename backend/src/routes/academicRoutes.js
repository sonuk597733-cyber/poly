import { Router } from "express";
import {
  getAttendance,
  markAttendance,
  getAttendanceSummary,
  getExams,
  submitExamMark,
  getExamResults,
  submitExamMarksBatch,
  submitExamMarksBatchForVerification,
  getPendingCoordinatorMarks,
  verifyExamMarksBatch,
  getPendingHODMarks,
  approveExamMarksHOD,
  rejectExamMarksBatch,
  sanctionExamMarksPrincipal,
  processSemesterResults,
  publishSemesterResults,
  getExamGazette,
  getExamRulesConfig,
  updateExamRulesConfig,
  getAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
  getTimetable,
  getNotices,
  createNotice,
  getLeaves,
  applyLeave,
  updateLeaveStatus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getManagementUsers,
  updateUserStatus,
  getReports,
  getMaterials,
  createMaterial,
  deleteMaterial,
  getFees,
  payFee,
  getLibraryBooks,
  getMyIssuedBooks,
  issueLibraryBook,
  returnLibraryBook,
  getFeedbacks,
  submitFeedback,
  respondFeedback,
  getRooms,
  allocateRoom,
  getCalendarEvents,
  createCalendarEvent,
  getAuditLogs,
  getSettings,
  updateSetting,
  getTeachers,
  getTeacherStats,
  getTeacherDetails,
  updateTeacherProfile,
  assignTeacherSlot,
  unassignTeacherSlot,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectStats,
  getHODAssignmentsOverview,
  getExamSchedules,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  getExamAnalytics,
  getLabEquipment,
  createLabEquipment,
  updateLabEquipment,
  deleteLabEquipment,
  getLabStats,
  getDepartmentEvents,
  createDepartmentEvent,
  updateDepartmentEvent,
  deleteDepartmentEvent,
  getPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
  getPlacementStats,
  getSessionalSubjects,
  getSessionalMarks,
  submitSessionalMarksBatch,
  updateSessionalMaxMarks,
  getSessionalAnalytics,
  getStudentSessionalResults,
  getScannedMarksheet
} from "../controllers/academicController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// All academic routes require authentication
router.use(protect);

// Attendance routes
router.get("/attendance", getAttendance);
router.post(
  "/attendance",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  markAttendance
);
router.get("/attendance/summary", getAttendanceSummary);

// Examinations & marks routes
router.get("/exams", getExams);
router.post(
  "/exams/marks",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  submitExamMark
);
router.post(
  "/exams/marks/batch",
  authorize("teacher", "hod", "coordinator", "admin"),
  submitExamMarksBatch
);
router.post(
  "/exams/marks/submit-batch",
  authorize("teacher", "hod", "coordinator", "admin"),
  submitExamMarksBatchForVerification
);

// Examination workflow pipeline
router.get(
  "/exams/workflow/pending",
  authorize("coordinator", "hod", "principal", "admin"),
  getPendingCoordinatorMarks
);
router.post(
  "/exams/workflow/verify",
  authorize("coordinator", "hod", "principal", "admin"),
  verifyExamMarksBatch
);
router.get(
  "/exams/workflow/hod-pending",
  authorize("hod", "principal", "admin"),
  getPendingHODMarks
);
router.post(
  "/exams/workflow/approve-hod",
  authorize("hod", "admin"),
  approveExamMarksHOD
);
router.post(
  "/exams/workflow/reject",
  authorize("coordinator", "hod", "principal", "admin"),
  rejectExamMarksBatch
);
router.post(
  "/exams/workflow/sanction",
  authorize("principal", "admin"),
  sanctionExamMarksPrincipal
);

// Authoritative result calculation & publication
router.post(
  "/exams/process-results",
  authorize("admin", "principal", "hod"),
  processSemesterResults
);
router.post(
  "/exams/publish-results",
  authorize("admin", "principal", "hod"),
  publishSemesterResults
);
router.get(
  "/exams/gazette",
  authorize("admin", "principal", "hod", "coordinator"),
  getExamGazette
);

// Examination Ordinance Rules Configuration
router.get(
  "/exams/rules",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getExamRulesConfig
);
router.put(
  "/exams/rules",
  authorize("admin", "principal", "hod"),
  updateExamRulesConfig
);

router.get("/exams/results", getExamResults);

// ============================================================
// THREE-SESSIONAL INTERNAL EXAMINATION SYSTEM ROUTES
// ============================================================
router.get(
  "/sessional/subjects",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getSessionalSubjects
);
router.get(
  "/sessional/marks",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getSessionalMarks
);
router.post(
  "/sessional/marks/batch",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  submitSessionalMarksBatch
);
router.put(
  "/sessional/max-marks",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  updateSessionalMaxMarks
);
router.get(
  "/sessional/analytics",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getSessionalAnalytics
);
router.get(
  "/sessional/student-results",
  getStudentSessionalResults
);
router.get("/scanned-marksheet", getScannedMarksheet);

// Assignments routes
router.get("/assignments", getAssignments);
router.post(
  "/assignments",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  createAssignment
);
router.post(
  "/assignments/:id/submit",
  authorize("student"),
  submitAssignment
);
router.patch(
  "/assignments/:id/grade",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  gradeAssignmentSubmission
);
router.delete(
  "/assignments/:id",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  deleteAssignment
);

// Timetable routes
router.get("/timetable", getTimetable);

// Notices routes
router.get("/notices", getNotices);
router.post(
  "/notices",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  createNotice
);

// Leaves routes
router.get("/leaves", getLeaves);
router.post("/leaves", applyLeave);
router.patch(
  "/leaves/:id/status",
  authorize("hod", "principal", "admin"),
  updateLeaveStatus
);

// Notifications routes
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

// Management & Admin routes
router.get(
  "/management/users",
  authorize("admin", "principal"),
  getManagementUsers
);
router.patch(
  "/management/users/:id/status",
  authorize("admin", "principal"),
  updateUserStatus
);
router.get(
  "/management/reports",
  authorize("teacher", "coordinator", "principal", "admin", "hod"),
  getReports
);

// Faculty & Teacher Command Center routes (HOD V5)
router.get(
  "/teachers/stats",
  authorize("hod", "principal", "admin", "coordinator", "teacher", "student"),
  getTeacherStats
);
router.get(
  "/teachers",
  authorize("hod", "principal", "admin", "coordinator", "teacher", "student"),
  getTeachers
);
router.get(
  "/teachers/:id",
  authorize("hod", "principal", "admin", "coordinator", "teacher", "student"),
  getTeacherDetails
);
router.patch(
  "/teachers/:id/profile",
  authorize("hod", "principal", "admin"),
  updateTeacherProfile
);
router.post(
  "/teachers/:id/assign",
  authorize("hod", "principal", "admin"),
  assignTeacherSlot
);
router.delete(
  "/teachers/:id/unassign",
  authorize("hod", "principal", "admin"),
  unassignTeacherSlot
);

// Course Materials & Video Lectures routes
router.get("/materials", getMaterials);
router.post(
  "/materials",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  createMaterial
);
router.delete(
  "/materials/:id",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  deleteMaterial
);

// Fees & Invoices
router.get("/fees", getFees);
router.post("/fees/pay", payFee);

// Library & Book Circulation
router.get("/library/books", getLibraryBooks);
router.get("/library/my-books", getMyIssuedBooks);
router.post(
  "/library/issue",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  issueLibraryBook
);
router.post(
  "/library/return",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  returnLibraryBook
);

// Feedback & Grievances
router.get("/feedback", getFeedbacks);
router.post("/feedback", submitFeedback);
router.patch(
  "/feedback/:id/respond",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  respondFeedback
);

// Campus Rooms & Allocation
router.get("/rooms", getRooms);
router.post(
  "/rooms/allocate",
  authorize("coordinator", "hod", "principal", "admin"),
  allocateRoom
);

// Academic Calendar & Events
router.get("/calendar", getCalendarEvents);
router.post(
  "/calendar",
  authorize("coordinator", "hod", "principal", "admin"),
  createCalendarEvent
);

// System Audit Logs & Configuration Settings
router.get(
  "/audit-logs",
  authorize("admin", "principal"),
  getAuditLogs
);
router.get("/settings", getSettings);
router.patch(
  "/settings",
  authorize("admin", "principal", "hod"),
  updateSetting
);

// ==========================================
// HOD 6 COMPLETE PRODUCTION MODULES ROUTES
// ==========================================

// 1. Academic Management (Subjects & Curriculum)
router.get("/subjects/stats", getSubjectStats);
router.get("/subjects", getSubjects);
router.post(
  "/subjects",
  authorize("hod", "principal", "admin"),
  createSubject
);
router.put(
  "/subjects/:id",
  authorize("hod", "principal", "admin"),
  updateSubject
);
router.delete(
  "/subjects/:id",
  authorize("hod", "principal", "admin"),
  deleteSubject
);

// 2. HOD Assignments Management
router.get(
  "/hod/assignments/overview",
  authorize("hod", "principal", "admin", "coordinator"),
  getHODAssignmentsOverview
);

// 3. Examination Management
router.get("/exams/analytics", getExamAnalytics);
router.get("/exams/schedules", getExamSchedules);
router.post(
  "/exams/schedules",
  authorize("hod", "principal", "admin", "coordinator"),
  createExamSchedule
);
router.put(
  "/exams/schedules/:id",
  authorize("hod", "principal", "admin", "coordinator"),
  updateExamSchedule
);
router.delete(
  "/exams/schedules/:id",
  authorize("hod", "principal", "admin"),
  deleteExamSchedule
);

// 4. Laboratory Management
router.get("/labs/stats", getLabStats);
router.get("/labs", getLabEquipment);
router.post(
  "/labs",
  authorize("hod", "principal", "admin"),
  createLabEquipment
);
router.put(
  "/labs/:id",
  authorize("hod", "principal", "admin"),
  updateLabEquipment
);
router.delete(
  "/labs/:id",
  authorize("hod", "principal", "admin"),
  deleteLabEquipment
);

// 5. Department Events & Activities
router.get("/events/department", getDepartmentEvents);
router.post(
  "/events/department",
  authorize("hod", "principal", "admin", "coordinator"),
  createDepartmentEvent
);
router.put(
  "/events/department/:id",
  authorize("hod", "principal", "admin", "coordinator"),
  updateDepartmentEvent
);
router.delete(
  "/events/department/:id",
  authorize("hod", "principal", "admin"),
  deleteDepartmentEvent
);

// 6. Placement & Internship
router.get("/placements/stats", getPlacementStats);
router.get("/placements", getPlacements);
router.post(
  "/placements",
  authorize("hod", "principal", "admin", "coordinator"),
  createPlacement
);
router.put(
  "/placements/:id",
  authorize("hod", "principal", "admin", "coordinator"),
  updatePlacement
);
router.delete(
  "/placements/:id",
  authorize("hod", "principal", "admin"),
  deletePlacement
);

export default router;
