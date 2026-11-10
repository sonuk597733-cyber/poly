import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAttendanceConfig,
  saveAttendanceConfig,
  getAttendanceRoster,
  getTodayTimetableSessions,
  getDailyCollegeAttendance,
  markDailyCollegeAttendance,
  getSubjectSessionAttendance,
  markSubjectSessionAttendance,
  correctAttendanceRecord,
  getStudentOverallAttendance,
  getStudentSubjectAttendance,
  getSubjectMonthlyCalendar,
  getSubjectAnalytics,
  getTeachingMonthlyCalendar,
  getLectureStudentRoster,
  getStudentSubjectHistory,
  getStudentTodayAttendance,
  getStudentDayAudit,
  getAttendanceAnalytics,
  simulateAttendanceProjection,
  exportAttendanceReport
} from "../controllers/attendanceController.js";

const router = express.Router();

// All attendance routes require valid authentication
router.use(protect);

// Staff roles authorized to configure and mark attendance
const STAFF_ROLES = ["teacher", "coordinator", "hod", "principal", "admin"];

// Configuration endpoints
router.get("/config", getAttendanceConfig);
router.post("/config", authorize(...STAFF_ROLES), saveAttendanceConfig);

// Roster & Timetable integration
router.get("/roster", getAttendanceRoster);
router.get("/today-timetable", getTodayTimetableSessions);

// System A: Daily College Attendance (1 day = 1 college record per student)
router.get("/daily-college", getDailyCollegeAttendance);
router.post("/daily-college", authorize(...STAFF_ROLES), markDailyCollegeAttendance);

// System B: Subject Lecture Attendance
router.get("/subject-session", getSubjectSessionAttendance);
router.post("/subject-session", authorize(...STAFF_ROLES), markSubjectSessionAttendance);

// Single Record Correction with Mandatory Audit Reason
router.post("/correct-record", authorize(...STAFF_ROLES), correctAttendanceRecord);

// Student Views (Students see their own; Staff can inspect any student via studentId query)
router.get("/student-overall", getStudentOverallAttendance);
router.get("/student-subjects", getStudentSubjectAttendance);
router.get("/subject-calendar", getSubjectMonthlyCalendar);
router.get("/subject-monthly-calendar", getSubjectMonthlyCalendar);
router.get("/subject-analytics", getSubjectAnalytics);
router.get("/subject-history", getStudentSubjectHistory);
router.get("/today-student", getStudentTodayAttendance);
router.get("/student-day-audit", getStudentDayAudit);

// Analytics & Shortage Reports
router.get("/analytics", authorize(...STAFF_ROLES), getAttendanceAnalytics);
router.get("/export-report", authorize(...STAFF_ROLES), exportAttendanceReport);

// Teaching Attendance Calendar & Lecture Roster (Staff)
router.get("/teaching-calendar", authorize(...STAFF_ROLES), getTeachingMonthlyCalendar);
router.get("/lecture-roster", authorize(...STAFF_ROLES), getLectureStudentRoster);

// What-If Simulation
router.post("/simulate-projection", simulateAttendanceProjection);

export default router;
