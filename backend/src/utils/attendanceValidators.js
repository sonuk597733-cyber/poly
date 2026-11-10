/**
 * ============================================================================
 * COLLEGEOS — ATTENDANCE REQUEST VALIDATORS & SANITIZATION ENGINE
 * Rigorous Input Validation, Boundary Checks, Role Permissions & Type Guards
 * ============================================================================
 */

import { ALLOWED_BRANCHES } from "../models/User.js";

/**
 * Standard Semester identifiers recognized across Subharti Polytechnic
 */
export const VALID_SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

/**
 * Standard Attendance Status values
 */
export const VALID_ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused"
];

/**
 * Validates Academic Attendance Configuration input
 *
 * @param {Object} data - Configuration payload
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
export function validateAttendanceConfigInput(data = {}) {
  const errors = [];
  const sanitized = {};

  // Branch
  if (!data.branch || typeof data.branch !== "string") {
    errors.push("Academic branch/department is required.");
  } else {
    sanitized.branch = data.branch.trim();
  }

  // Semester
  if (!data.semester || typeof data.semester !== "string") {
    errors.push("Academic semester is required.");
  } else {
    sanitized.semester = data.semester.trim();
  }

  // Section
  sanitized.section = typeof data.section === "string" ? data.section.trim().toUpperCase() : "A";

  // Academic Session
  sanitized.academicSession = typeof data.academicSession === "string" ? data.academicSession.trim() : "2025-2026";

  // Class Commencement Date
  if (!data.commencementDate) {
    errors.push("Class commencement date is mandatory. All attendance calculations start from this date.");
  } else {
    const d = new Date(data.commencementDate);
    if (isNaN(d.getTime())) {
      errors.push("Invalid class commencement date format.");
    } else {
      sanitized.commencementDate = d;
    }
  }

  // Academic End Date
  if (data.academicEndDate) {
    const d = new Date(data.academicEndDate);
    if (!isNaN(d.getTime())) {
      sanitized.academicEndDate = d;
    }
  }

  // Minimum Attendance Percentage Benchmark
  const minPct = Number(data.minAttendancePercentage);
  if (minPct !== undefined && !isNaN(minPct)) {
    if (minPct < 1 || minPct > 100) {
      errors.push("Minimum attendance percentage must be between 1% and 100%.");
    } else {
      sanitized.minAttendancePercentage = minPct;
    }
  } else {
    sanitized.minAttendancePercentage = 60;
  }

  // Working Days
  if (Array.isArray(data.workingDays) && data.workingDays.length > 0) {
    sanitized.workingDays = data.workingDays.filter(day => typeof day === "string");
  } else {
    sanitized.workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }

  // Holidays
  if (Array.isArray(data.holidays)) {
    sanitized.holidays = data.holidays.map(h => ({
      title: typeof h.title === "string" ? h.title.trim() : "Declared Holiday",
      date: new Date(h.date),
      type: typeof h.type === "string" ? h.type : "holiday"
    })).filter(h => !isNaN(h.date.getTime()));
  } else {
    sanitized.holidays = [];
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates Daily College Attendance roll call submission
 *
 * @param {Object} data - Daily attendance payload
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
export function validateDailyAttendanceSubmission(data = {}) {
  const errors = [];
  const sanitized = {};

  if (!data.date) {
    errors.push("Attendance date is required.");
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) {
      errors.push("Invalid attendance date format.");
    } else {
      sanitized.date = d;
    }
  }

  if (!Array.isArray(data.records) || data.records.length === 0) {
    errors.push("Student attendance records array is required and cannot be empty.");
  } else {
    sanitized.records = data.records.map(r => ({
      studentId: r.studentId,
      status: VALID_ATTENDANCE_STATUSES.includes(r.status) ? r.status : "present",
      remarks: typeof r.remarks === "string" ? r.remarks.trim() : "",
      reason: typeof r.reason === "string" ? r.reason.trim() : ""
    })).filter(r => r.studentId);

    if (sanitized.records.length === 0) {
      errors.push("Records array must contain at least one valid student ID reference.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates Subject Lecture Session submission
 *
 * @param {Object} data - Subject session payload
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
export function validateSubjectSessionSubmission(data = {}) {
  const errors = [];
  const sanitized = {};

  if (!data.subject || typeof data.subject !== "string" || !data.subject.trim()) {
    errors.push("Subject name is required.");
  } else {
    sanitized.subject = data.subject.trim();
  }

  if (!data.date) {
    errors.push("Lecture date is required.");
  } else {
    const d = new Date(data.date);
    if (isNaN(d.getTime())) {
      errors.push("Invalid lecture date format.");
    } else {
      sanitized.date = d;
    }
  }

  const periodNum = Number(data.periodNumber);
  if (isNaN(periodNum) || periodNum < 1 || periodNum > 12) {
    errors.push("Period number must be a valid integer between 1 and 12.");
  } else {
    sanitized.periodNumber = Math.floor(periodNum);
  }

  sanitized.subjectCode = typeof data.subjectCode === "string" ? data.subjectCode.trim() : "";
  sanitized.startTime = typeof data.startTime === "string" ? data.startTime.trim() : "";
  sanitized.endTime = typeof data.endTime === "string" ? data.endTime.trim() : "";
  sanitized.roomNo = typeof data.roomNo === "string" ? data.roomNo.trim() : "Room 302";
  sanitized.topic = typeof data.topic === "string" ? data.topic.trim() : "";
  sanitized.sessionType = ["theory", "lab", "tutorial", "activity"].includes(data.sessionType)
    ? data.sessionType
    : "theory";

  if (!Array.isArray(data.records) || data.records.length === 0) {
    errors.push("Student attendance records array is required.");
  } else {
    sanitized.records = data.records.map(r => ({
      studentId: r.studentId,
      studentName: typeof r.studentName === "string" ? r.studentName.trim() : "",
      rollNumber: typeof r.rollNumber === "string" ? r.rollNumber.trim() : "",
      status: VALID_ATTENDANCE_STATUSES.includes(r.status) ? r.status : "present",
      remarks: typeof r.remarks === "string" ? r.remarks.trim() : "",
      reason: typeof r.reason === "string" ? r.reason.trim() : ""
    })).filter(r => r.studentId);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates Retroactive Attendance Correction request
 * Enforces MANDATORY audit explanation reason
 *
 * @param {Object} data - Correction payload
 * @returns {{ isValid: boolean, errors: string[], sanitized: Object }}
 */
export function validateCorrectionRequest(data = {}) {
  const errors = [];
  const sanitized = {};

  if (!data.recordId) {
    errors.push("Target record ID is required.");
  } else {
    sanitized.recordId = data.recordId;
  }

  if (!VALID_ATTENDANCE_STATUSES.includes(data.newStatus)) {
    errors.push(`Invalid new status. Must be one of: ${VALID_ATTENDANCE_STATUSES.join(", ")}.`);
  } else {
    sanitized.newStatus = data.newStatus;
  }

  if (!data.reason || typeof data.reason !== "string" || data.reason.trim().length < 5) {
    errors.push("A substantive audit reason (minimum 5 characters) is mandatory for retroactive attendance corrections.");
  } else {
    sanitized.reason = data.reason.trim();
  }

  sanitized.type = data.type === "daily" ? "daily" : "subject";

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

export default {
  VALID_SEMESTERS,
  VALID_ATTENDANCE_STATUSES,
  validateAttendanceConfigInput,
  validateDailyAttendanceSubmission,
  validateSubjectSessionSubmission,
  validateCorrectionRequest
};
