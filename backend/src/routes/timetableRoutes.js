import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { timetableUpload } from "../middleware/timetableUploadMiddleware.js";
import {
  getTimetableDashboardStats,
  getTimetableConfig,
  saveTimetableConfig,
  getTimetableSubjects,
  getAcademicStaffList,
  updateTimetableSubject,
  getTimetableRooms,
  saveTimetableRoom,
  getFacultyAvailability,
  saveFacultyAvailability,
  generateTimetable,
  getManageTimetable,
  saveManualTimetable,
  uploadTimetablePhoto,
  extractTimetablePhoto,
  savePhotoTimetable,
  checkTimetableConflicts,
  handleTimetableWorkflow,
  publishTimetable,
  getPublishedTimetable,
  getTeacherPersonalSchedule,
  getStudentClassSchedule,
  getTimetableVersions,
  restoreTimetableVersion,
  getTimetableReports
} from "../controllers/timetableController.js";

const router = express.Router();

// All routes require authenticated user
router.use(protect);

// Dashboard Metrics
router.get(
  "/dashboard-stats",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getTimetableDashboardStats
);

// Academic Configuration
router.get(
  "/config",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getTimetableConfig
);
router.post(
  "/config",
  authorize("coordinator", "hod", "principal", "admin"),
  saveTimetableConfig
);

// Subject & Faculty Mapping
router.get(
  "/subjects",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getTimetableSubjects
);
router.get(
  "/faculty-staff",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getAcademicStaffList
);
router.post(
  "/subjects",
  authorize("coordinator", "hod", "principal", "admin"),
  updateTimetableSubject
);

// Rooms & Labs
router.get(
  "/rooms",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getTimetableRooms
);
router.post(
  "/rooms",
  authorize("coordinator", "hod", "principal", "admin"),
  saveTimetableRoom
);

// Faculty Availability
router.get(
  "/availability",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getFacultyAvailability
);
router.post(
  "/availability",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  saveFacultyAvailability
);

// Automatic Generator
router.post(
  "/generate",
  authorize("coordinator", "hod", "principal", "admin"),
  generateTimetable
);

// Manual Timetable Management & Editing
router.get(
  "/manage",
  authorize("coordinator", "hod", "principal", "admin"),
  getManageTimetable
);
router.post(
  "/manage",
  authorize("coordinator", "hod", "principal", "admin"),
  saveManualTimetable
);

// Timetable Photograph Upload & OCR Extraction
router.post(
  "/upload-photo",
  authorize("coordinator", "hod", "principal", "admin"),
  timetableUpload,
  uploadTimetablePhoto
);
router.post(
  "/extract-photo",
  authorize("coordinator", "hod", "principal", "admin"),
  extractTimetablePhoto
);
router.post(
  "/save-photo-timetable",
  authorize("coordinator", "hod", "principal", "admin"),
  savePhotoTimetable
);

// Conflict Detection Center
router.post(
  "/check-conflicts",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  checkTimetableConflicts
);

// Approval Workflow
router.post(
  "/workflow",
  authorize("coordinator", "hod", "principal", "admin"),
  handleTimetableWorkflow
);

// Publishing
router.post(
  "/publish",
  authorize("hod", "principal", "admin"),
  publishTimetable
);

// Published Schedule Integration (Student, Teacher, Faculty)
router.get(
  "/published",
  authorize("student", "teacher", "coordinator", "hod", "principal", "admin"),
  getPublishedTimetable
);
router.get(
  "/teacher-schedule",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getTeacherPersonalSchedule
);
router.get(
  "/student-schedule",
  authorize("student", "coordinator", "hod", "principal", "admin"),
  getStudentClassSchedule
);

// Version Control
router.get(
  "/versions",
  authorize("coordinator", "hod", "principal", "admin"),
  getTimetableVersions
);
router.post(
  "/versions/restore",
  authorize("coordinator", "hod", "principal", "admin"),
  restoreTimetableVersion
);

// Reports & Exports
router.get(
  "/reports",
  authorize("coordinator", "hod", "principal", "admin", "teacher"),
  getTimetableReports
);

export default router;
