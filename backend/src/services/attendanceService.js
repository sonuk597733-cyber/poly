import mongoose from "mongoose";
import AcademicAttendanceConfig from "../models/AcademicAttendanceConfig.js";
import DailyCollegeAttendance from "../models/DailyCollegeAttendance.js";
import SubjectAttendanceSession from "../models/SubjectAttendanceSession.js";
import SubjectAttendanceRecord from "../models/SubjectAttendanceRecord.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { resolveDepartmentBranch } from "../utils/validators.js";

/**
 * Standard Day of Week Names mapping from UTC day index (0 = Sunday)
 */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

/**
 * Normalizes any valid date input into UTC midnight (00:00:00.000Z)
 * This guarantees consistent date boundary lookups across timezones.
 *
 * @param {Date|string|number} d - Input date
 * @returns {Date} Normalized UTC midnight Date object
 */
export function normalizeDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Formats a date into YYYY-MM-DD ISO string format
 *
 * @param {Date|string} d
 * @returns {string} YYYY-MM-DD string
 */
export function formatDateKey(d) {
  return normalizeDate(d).toISOString().split("T")[0];
}

/**
 * Calculates official eligible college working days strictly between startDate and endDate
 * Takes into account:
 * 1. Allowed working days of week (default Monday through Saturday)
 * 2. Declared institutional holidays and vacations
 * 3. Special declared working days (e.g. compensatory working Saturdays/Sundays)
 *
 * @param {Date|string} startDate - Beginning of academic calculation period
 * @param {Date|string} endDate - End of academic calculation period
 * @param {string[]} [workingDayNames] - Array of working day names
 * @param {Array} [holidays] - Declared holiday records
 * @param {Array} [specialWorkingDays] - Special working day records
 * @returns {{ count: number, dateList: Date[], dateStrings: string[] }}
 */
export function calculateWorkingDays(
  startDate,
  endDate,
  workingDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  holidays = [],
  specialWorkingDays = []
) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start > end) {
    return { count: 0, dateList: [], dateStrings: [] };
  }

  const holidayDateStrings = new Set(
    (holidays || []).map(h => formatDateKey(h.date || h))
  );

  const specialDateStrings = new Set(
    (specialWorkingDays || []).map(s => formatDateKey(s.date || s))
  );

  let current = new Date(start);
  let count = 0;
  const dateList = [];
  const dateStrings = [];

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayName = DAY_NAMES[current.getUTCDay()];

    const isHoliday = holidayDateStrings.has(dateStr);
    const isSpecial = specialDateStrings.has(dateStr);
    const isRegularWorking = workingDayNames.includes(dayName);

    // Evaluation Logic:
    // 1. If date is declared as a special working day, it counts as working regardless of day of week
    // 2. Otherwise, if it is a regular working day of week AND NOT a declared holiday, it counts as working
    if (isSpecial || (isRegularWorking && !isHoliday)) {
      count++;
      dateList.push(new Date(current));
      dateStrings.push(dateStr);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { count, dateList, dateStrings };
}

/**
 * Computes consecutive days needed to reach a minimum attendance benchmark
 * Mathematical derivation:
 * (Attended + X) / (Total + X) >= Benchmark
 * => Attended + X >= Benchmark * Total + Benchmark * X
 * => (1 - Benchmark) * X >= Benchmark * Total - Attended
 * => X = ceil((Benchmark * Total - Attended) / (1 - Benchmark))
 *
 * @param {number} attended - Number of attended days or lectures
 * @param {number} total - Total eligible days or conducted lectures
 * @param {number} [benchmarkPct=60] - Target minimum percentage (default: 60)
 * @returns {number} Minimum consecutive days/lectures needed (0 if already compliant)
 */
export function calculateDaysNeededForBenchmark(attended, total, benchmarkPct = 60) {
  if (total <= 0) return 0;
  const benchmarkFraction = (Number(benchmarkPct) || 60) / 100;
  const currentRatio = attended / total;

  if (currentRatio >= benchmarkFraction) {
    return 0;
  }

  const denominator = 1 - benchmarkFraction;
  if (denominator <= 0) return 0;

  const required = (benchmarkFraction * total - attended) / denominator;
  return Math.max(0, Math.ceil(required));
}

/**
 * Simulates future attendance projection given hypothetical future attendance pattern
 *
 * @param {number} currentAttended - Currently attended days/lectures
 * @param {number} currentTotal - Currently conducted/eligible days/lectures
 * @param {number} futureSessionsToAttend - Hypothetical future sessions attended
 * @param {number} futureSessionsToMiss - Hypothetical future sessions missed
 * @param {number} [benchmarkPct=60] - Minimum compliance threshold
 * @returns {{ projectedTotal: number, projectedAttended: number, projectedPercentage: number, isCompliant: boolean }}
 */
export function simulateProjection(
  currentAttended,
  currentTotal,
  futureSessionsToAttend = 0,
  futureSessionsToMiss = 0,
  benchmarkPct = 60
) {
  const projectedAttended = currentAttended + Math.max(0, Number(futureSessionsToAttend) || 0);
  const futureTotal = Math.max(0, Number(futureSessionsToAttend) || 0) + Math.max(0, Number(futureSessionsToMiss) || 0);
  const projectedTotal = currentTotal + futureTotal;

  const projectedPercentage = projectedTotal > 0
    ? Number(((projectedAttended / projectedTotal) * 100).toFixed(1))
    : 100;

  const isCompliant = projectedPercentage >= benchmarkPct;

  return {
    projectedTotal,
    projectedAttended,
    projectedPercentage,
    isCompliant,
    benchmarkPct
  };
}

/**
 * Generates an institutional compliance warning notice for shortage students
 *
 * @param {Object} student - Student document with name and roll number
 * @param {string} courseOrType - Course name or "Overall College Attendance"
 * @param {number} currentPct - Current attendance percentage
 * @param {number} neededUnits - Days or lectures needed to restore compliance
 * @param {string} branch - Branch name
 * @param {string} semester - Semester name
 * @returns {string} Official notice text
 */
export function generateShortageNoticeText(student, courseOrType, currentPct, neededUnits, branch, semester) {
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return `
SWAMI VIVEKANAND SUBHARTI UNIVERSITY
SUBHARTI POLYTECHNIC COLLEGE — OFFICE OF ACADEMIC COMPLIANCE
REF: SPC/ACAD/ATTN/${new Date().getFullYear()}/${student.rollNumber || "NOTICE"}
DATE: ${todayStr}

OFFICIAL ACADEMIC ATTENDANCE SHORTAGE ADVISORY

To:
Student Name: ${student.fullName || student.name || "Student"}
Enrollment/Roll No: ${student.rollNumber || student.enrollmentNo || "N/A"}
Academic Department: ${branch}
Enrolled Semester: ${semester}

SUBJECT: MANDATORY NOTICE REGARDING DEFICIT IN ACADEMIC ATTENDANCE BENCHMARK

Dear Student,

Institutional review of official attendance records confirms that your attendance in "${courseOrType}" currently stands at ${currentPct}%, which falls below the statutory minimum threshold of 60.0% mandated by Swami Vivekanand Subharti University Academic Regulations.

To maintain eligibility for end-semester examinations and prevent academic debarment, you are required to attend the next ${neededUnits} consecutive working day(s) / conducted lecture(s) without unauthorized absence.

Please treat this communication with urgent priority. For medical exemptions or authorized institutional leave, submit original verified documentation to the Department Academic Coordinator within three (3) working days.

By Order of:
Academic Compliance Committee
Subharti Polytechnic College
Swami Vivekanand Subharti University, Meerut
`.trim();
}

export default {
  DAY_NAMES,
  normalizeDate,
  formatDateKey,
  calculateWorkingDays,
  calculateDaysNeededForBenchmark,
  simulateProjection,
  generateShortageNoticeText
};
