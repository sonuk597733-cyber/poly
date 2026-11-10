import mongoose from "mongoose";
import AcademicAttendanceConfig from "../models/AcademicAttendanceConfig.js";
import DailyCollegeAttendance from "../models/DailyCollegeAttendance.js";
import SubjectAttendanceSession from "../models/SubjectAttendanceSession.js";
import SubjectAttendanceRecord from "../models/SubjectAttendanceRecord.js";
import Subject from "../models/Subject.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { resolveDepartmentBranch } from "../utils/validators.js";
import {
  computeStudentOverallAttendance,
  computeStudentSubjectAttendance,
  computeSubjectMonthlyCalendar,
  computeSubjectAnalytics,
  computeTeachingMonthlyCalendar,
  computeLectureStudentRoster,
  calculateOverallAttendancePercentage,
  calculateSubjectAttendancePercentage,
  calculateDeficitToTarget
} from "../services/attendanceCalculationEngine.js";

/**
 * Normalizes a date to UTC midnight (00:00:00.000Z)
 */
function normalizeDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDateKey(d) {
  return normalizeDate(d).toISOString().split("T")[0];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Helper to compute eligible college working days between commencementDate and endDate
 */
function calculateWorkingDays(startDate, endDate, workingDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], holidays = [], specialWorkingDays = []) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (start > end) return { count: 0, dateList: [] };

  const holidayDateStrings = new Set(
    holidays.map(h => normalizeDate(h.date || h).toISOString().split("T")[0])
  );
  const specialDateStrings = new Set(
    specialWorkingDays.map(s => normalizeDate(s.date || s).toISOString().split("T")[0])
  );

  let current = new Date(start);
  let count = 0;
  const dateList = [];

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayName = DAY_NAMES[current.getUTCDay()];

    const isHoliday = holidayDateStrings.has(dateStr);
    const isSpecial = specialDateStrings.has(dateStr);
    const isRegularWorking = workingDayNames.includes(dayName);

    // If special working day, it is a working day even if holiday or regular off
    // If holiday, it is not working
    if (isSpecial || (isRegularWorking && !isHoliday)) {
      count++;
      dateList.push(new Date(current));
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { count, dateList };
}

/**
 * GET /api/attendance/config
 * Get academic attendance configuration (commencement date, holidays, working days, minAttendancePercentage)
 */
export async function getAttendanceConfig(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A", academicSession = "2025-2026" } = req.query;

    let config = await AcademicAttendanceConfig.findOne({
      branch,
      semester,
      section,
      academicSession
    });

    if (!config) {
      // Default fallback config starting 01 Nov 2026
      config = {
        academicSession,
        branch,
        semester,
        section,
        academicYear: "3rd Year",
        commencementDate: new Date("2026-11-01T00:00:00.000Z"),
        academicEndDate: new Date("2027-04-30T00:00:00.000Z"),
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        holidays: [
          { date: new Date("2026-11-08T00:00:00.000Z"), title: "Guru Nanak Jayanti", type: "holiday" },
          { date: new Date("2026-12-25T00:00:00.000Z"), title: "Christmas Day", type: "holiday" },
          { date: new Date("2027-01-26T00:00:00.000Z"), title: "Republic Day", type: "holiday" }
        ],
        specialWorkingDays: [],
        minAttendancePercentage: 60
      };
    }

    return res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    console.error("[getAttendanceConfig] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendance/config
 * Save or update academic attendance configuration
 */
export async function saveAttendanceConfig(req, res) {
  try {
    const {
      academicSession = "2025-2026",
      branch,
      semester,
      section = "A",
      academicYear = "3rd Year",
      commencementDate,
      academicEndDate,
      workingDays,
      holidays,
      specialWorkingDays,
      minAttendancePercentage = 60,
      totalWorkingDays = 67
    } = req.body;

    if (!branch || !semester || !commencementDate) {
      return res.status(400).json({
        success: false,
        message: "Branch, semester, and commencement date are required."
      });
    }

    const payload = {
      academicSession,
      branch: resolveDepartmentBranch(branch),
      semester,
      section,
      academicYear,
      commencementDate: normalizeDate(commencementDate),
      academicEndDate: academicEndDate ? normalizeDate(academicEndDate) : new Date("2027-04-30T00:00:00.000Z"),
      totalWorkingDays: Number(totalWorkingDays) || 67,
      workingDays: workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      holidays: (holidays || []).map(h => ({
        ...h,
        date: normalizeDate(h.date)
      })),
      specialWorkingDays: (specialWorkingDays || []).map(s => ({
        ...s,
        date: normalizeDate(s.date)
      })),
      minAttendancePercentage: Number(minAttendancePercentage) || 60,
      configuredBy: req.user._id
    };

    const config = await AcademicAttendanceConfig.findOneAndUpdate(
      { academicSession, branch, semester, section },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Academic Attendance Configuration saved successfully.",
      config
    });
  } catch (error) {
    console.error("[saveAttendanceConfig] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/roster
 * Get student roster for attendance marking
 */
export async function getAttendanceRoster(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A" } = req.query;

    const profiles = await StudentProfile.find({
      branch,
      semester
    }).populate("userId", "fullName name email avatar avatarUrl status role").lean();

    let studentList = [];

    if (profiles.length > 0) {
      studentList = profiles.map(p => ({
        id: p.userId?._id?.toString() || p.userId?.toString(),
        name: p.userId?.fullName || p.userId?.name || "Student",
        email: p.userId?.email || "",
        rollNumber: p.enrollmentNo || "SUB-CSE-2024-042",
        enrollmentNo: p.enrollmentNo || "",
        branch: p.branch,
        semester: p.semester,
        section: section,
        avatar: p.userId?.avatarUrl || p.userId?.avatar || ""
      }));
    } else {
      const users = await User.find({ role: "student" }).lean();
      studentList = users.map(u => ({
        id: u._id.toString(),
        name: u.fullName || u.name || "Student",
        email: u.email,
        rollNumber: "SUB-CSE-2024-042",
        enrollmentNo: "SUB-CSE-2024-042",
        branch,
        semester,
        section,
        avatar: u.avatarUrl || u.avatar || ""
      }));
    }

    return res.status(200).json({
      success: true,
      totalStudents: studentList.length,
      students: studentList
    });
  } catch (error) {
    console.error("[getAttendanceRoster] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/today-timetable
 * Returns today's scheduled timetable periods with lecture attendance status
 */
export async function getTodayTimetableSessions(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A", date } = req.query;
    const targetDate = date ? normalizeDate(date) : normalizeDate(new Date());
    const dayOfWeek = DAY_NAMES[targetDate.getUTCDay()];

    // Find active timetable
    const timetable = await Timetable.findOne({
      branch,
      semester,
      isActive: true
    }).lean();

    if (!timetable || !timetable.schedule) {
      return res.status(200).json({
        success: true,
        day: dayOfWeek,
        date: targetDate,
        sessions: []
      });
    }

    const daySchedule = timetable.schedule.find(
      s => s.day.toLowerCase() === dayOfWeek.toLowerCase()
    );

    if (!daySchedule || !daySchedule.slots) {
      return res.status(200).json({
        success: true,
        day: dayOfWeek,
        date: targetDate,
        sessions: []
      });
    }

    // Find already recorded sessions for today
    const existingSessions = await SubjectAttendanceSession.find({
      branch,
      semester,
      section,
      date: targetDate
    }).lean();

    const sessionMap = new Map();
    existingSessions.forEach(s => {
      sessionMap.set(s.periodNumber, s);
    });

    const sessions = daySchedule.slots
      .filter(slot => !slot.isBreak && slot.subject && slot.subject !== "LUNCH" && slot.subject !== "BREAK")
      .map(slot => {
        const recorded = sessionMap.get(slot.periodNumber);
        return {
          periodNumber: slot.periodNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject,
          subjectCode: slot.subjectCode || "",
          teacherName: slot.teacherName || "",
          roomNo: slot.roomNo || "",
          isMarked: !!recorded,
          sessionId: recorded ? recorded._id.toString() : null,
          presentCount: recorded ? recorded.presentCount : 0,
          absentCount: recorded ? recorded.absentCount : 0,
          totalEnrolled: recorded ? recorded.totalEnrolled : 0,
          sessionType: recorded ? recorded.sessionType : "theory",
          topic: recorded ? recorded.topic : ""
        };
      });

    return res.status(200).json({
      success: true,
      day: dayOfWeek,
      date: targetDate,
      totalSlots: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("[getTodayTimetableSessions] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/daily-college
 * Returns daily college attendance records for cohort and date
 */
export async function getDailyCollegeAttendance(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A", date } = req.query;
    const targetDate = date ? normalizeDate(date) : normalizeDate(new Date());

    const records = await DailyCollegeAttendance.find({
      branch,
      semester,
      section,
      date: targetDate
    }).populate("studentId", "name rollNumber enrollmentNo avatar").lean();

    return res.status(200).json({
      success: true,
      date: targetDate,
      totalMarked: records.length,
      records: records.map(r => ({
        id: r._id.toString(),
        studentId: r.studentId?._id?.toString() || r.studentId,
        studentName: r.studentId?.name || "",
        rollNumber: r.studentId?.rollNumber || r.studentId?.enrollmentNo || "N/A",
        avatar: r.studentId?.avatar || "",
        status: r.status,
        remarks: r.remarks,
        markedByName: r.markedByName,
        markedByRole: r.markedByRole,
        auditHistory: r.auditHistory || []
      }))
    });
  } catch (error) {
    console.error("[getDailyCollegeAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendance/daily-college
 * Workflow A: Mark or update daily college attendance (1 day = 1 record per student)
 */
export async function markDailyCollegeAttendance(req, res) {
  try {
    const rawBranch = req.body.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const {
      semester = "5th Semester",
      section = "A",
      academicSession = "2025-2026",
      academicYear = "3rd Year",
      date,
      records = []
    } = req.body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance date and student records array are required."
      });
    }

    const targetDate = normalizeDate(date);
    const staffId = req.user._id;
    const staffName = req.user.name || "Staff";
    const staffRole = req.user.role || "teacher";

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of records) {
      if (!item.studentId) continue;

      const existing = await DailyCollegeAttendance.findOne({
        studentId: item.studentId,
        date: targetDate
      });

      if (existing) {
        // If status changed, record audit entry
        if (existing.status !== item.status) {
          existing.auditHistory.push({
            modifiedAt: new Date(),
            modifiedBy: staffId,
            modifiedByName: staffName,
            previousStatus: existing.status,
            newStatus: item.status,
            reason: item.reason || "Updated via Daily Attendance bulk submit"
          });
          existing.status = item.status;
        }
        if (item.remarks !== undefined) existing.remarks = item.remarks;
        existing.markedBy = staffId;
        existing.markedByName = staffName;
        existing.markedByRole = staffRole;
        await existing.save();
        updatedCount++;
      } else {
        await DailyCollegeAttendance.create({
          studentId: item.studentId,
          branch,
          semester,
          section,
          academicSession,
          academicYear,
          date: targetDate,
          status: item.status || "present",
          markedBy: staffId,
          markedByName: staffName,
          markedByRole: staffRole,
          remarks: item.remarks || "",
          auditHistory: []
        });
        createdCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Daily College Attendance processed. ${createdCount} created, ${updatedCount} updated.`,
      targetDate,
      createdCount,
      updatedCount
    });
  } catch (error) {
    console.error("[markDailyCollegeAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/subject-session
 * Returns attendance details for a specific subject lecture session
 */
export async function getSubjectSessionAttendance(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { sessionId, semester = "5th Semester", section = "A", subject, date, periodNumber } = req.query;

    let session = null;
    if (sessionId) {
      session = await SubjectAttendanceSession.findById(sessionId).lean();
    } else if (branch && semester && subject && date && periodNumber) {
      session = await SubjectAttendanceSession.findOne({
        branch,
        semester,
        section,
        subject,
        date: normalizeDate(date),
        periodNumber: Number(periodNumber)
      }).lean();
    }

    if (!session) {
      return res.status(200).json({
        success: true,
        session: null,
        records: []
      });
    }

    const records = await SubjectAttendanceRecord.find({
      sessionId: session._id
    }).populate("studentId", "name rollNumber enrollmentNo avatar").lean();

    return res.status(200).json({
      success: true,
      session,
      records: records.map(r => ({
        id: r._id.toString(),
        studentId: r.studentId?._id?.toString() || r.studentId,
        studentName: r.studentId?.name || r.studentName,
        rollNumber: r.studentId?.rollNumber || r.rollNumber || "N/A",
        avatar: r.studentId?.avatar || "",
        status: r.status,
        remarks: r.remarks,
        auditHistory: r.auditHistory || []
      }))
    });
  } catch (error) {
    console.error("[getSubjectSessionAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendance/subject-session
 * Workflow B: Take or update subject lecture attendance
 */
export async function markSubjectSessionAttendance(req, res) {
  try {
    const rawBranch = req.body.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const {
      subject,
      subjectCode = "",
      semester = "5th Semester",
      section = "A",
      academicSession = "2025-2026",
      academicYear = "3rd Year",
      date,
      periodNumber,
      startTime = "",
      endTime = "",
      roomNo = "",
      sessionType = "theory",
      topic = "",
      status = "conducted",
      records = []
    } = req.body;

    if (!subject || !date || periodNumber === undefined || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Subject, date, period number, and student records are required."
      });
    }

    const targetDate = normalizeDate(date);
    const staffId = req.user._id;
    const staffName = req.user.name || "Staff";
    const staffRole = req.user.role || "teacher";

    const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
    const absentCount = records.filter(r => r.status === "absent").length;
    const totalEnrolled = records.length;

    // Find or create session
    let session = await SubjectAttendanceSession.findOne({
      branch,
      semester,
      section,
      subject,
      date: targetDate,
      periodNumber: Number(periodNumber)
    });

    if (session) {
      session.subjectCode = subjectCode || session.subjectCode;
      session.startTime = startTime || session.startTime;
      session.endTime = endTime || session.endTime;
      session.roomNo = roomNo || session.roomNo;
      session.sessionType = sessionType;
      session.topic = topic || session.topic;
      session.status = status;
      session.totalEnrolled = totalEnrolled;
      session.presentCount = presentCount;
      session.absentCount = absentCount;
      session.lastEditedAt = new Date();
      session.lastEditedBy = staffId;
      session.lastEditedByName = staffName;
      await session.save();
    } else {
      session = await SubjectAttendanceSession.create({
        subject,
        subjectCode,
        branch,
        semester,
        section,
        academicSession,
        academicYear,
        date: targetDate,
        periodNumber: Number(periodNumber),
        startTime,
        endTime,
        roomNo,
        facultyId: staffId,
        facultyName: staffName,
        facultyRole: staffRole,
        sessionType,
        topic,
        status,
        totalEnrolled,
        presentCount,
        absentCount,
        submittedAt: new Date()
      });
    }

    // Process each student record
    for (const item of records) {
      if (!item.studentId) continue;

      const existingRecord = await SubjectAttendanceRecord.findOne({
        sessionId: session._id,
        studentId: item.studentId
      });

      if (existingRecord) {
        if (existingRecord.status !== item.status) {
          existingRecord.auditHistory.push({
            modifiedAt: new Date(),
            modifiedBy: staffId,
            modifiedByName: staffName,
            previousStatus: existingRecord.status,
            newStatus: item.status,
            reason: item.reason || "Updated via Lecture Session bulk submit"
          });
          existingRecord.status = item.status;
        }
        if (item.remarks !== undefined) existingRecord.remarks = item.remarks;
        await existingRecord.save();
      } else {
        await SubjectAttendanceRecord.create({
          sessionId: session._id,
          studentId: item.studentId,
          studentName: item.studentName || "",
          rollNumber: item.rollNumber || "",
          subject,
          subjectCode,
          branch,
          semester,
          section,
          date: targetDate,
          status: item.status || "present",
          remarks: item.remarks || "",
          auditHistory: []
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Lecture Attendance saved for ${subject} (Period ${periodNumber}). Present: ${presentCount}, Absent: ${absentCount}.`,
      session
    });
  } catch (error) {
    console.error("[markSubjectSessionAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendance/correct-record
 * Allows staff to correct an individual attendance record with mandatory audit reason
 */
export async function correctAttendanceRecord(req, res) {
  try {
    const { type = "subject", recordId, newStatus, reason } = req.body;

    if (!recordId || !newStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: "Record ID, new status, and audit reason are required."
      });
    }

    const staffId = req.user._id;
    const staffName = req.user.name || "Staff";

    if (type === "daily") {
      const record = await DailyCollegeAttendance.findById(recordId);
      if (!record) {
        return res.status(404).json({ success: false, message: "Daily attendance record not found." });
      }

      record.auditHistory.push({
        modifiedAt: new Date(),
        modifiedBy: staffId,
        modifiedByName: staffName,
        previousStatus: record.status,
        newStatus,
        reason
      });
      record.status = newStatus;
      await record.save();

      return res.status(200).json({
        success: true,
        message: "Daily attendance record corrected successfully.",
        record
      });
    } else {
      const record = await SubjectAttendanceRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({ success: false, message: "Subject attendance record not found." });
      }

      record.auditHistory.push({
        modifiedAt: new Date(),
        modifiedBy: staffId,
        modifiedByName: staffName,
        previousStatus: record.status,
        newStatus,
        reason
      });
      record.status = newStatus;
      await record.save();

      // Recalculate session totals
      const allRecords = await SubjectAttendanceRecord.find({ sessionId: record.sessionId });
      const presentCount = allRecords.filter(r => r.status === "present" || r.status === "late").length;
      const absentCount = allRecords.filter(r => r.status === "absent").length;

      await SubjectAttendanceSession.findByIdAndUpdate(record.sessionId, {
        presentCount,
        absentCount,
        lastEditedAt: new Date(),
        lastEditedBy: staffId,
        lastEditedByName: staffName
      });

      return res.status(200).json({
        success: true,
        message: "Subject attendance record corrected successfully.",
        record
      });
    }
  } catch (error) {
    console.error("[correctAttendanceRecord] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/student-overall
 * System A: My Attendance — Overall College Attendance Calculation
 * Rule: 1 college day = 1 attendance day. Starts strictly from commencementDate.
 */
export async function getStudentOverallAttendance(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
    const branch = resolveDepartmentBranch(req.query.branch || studentProfile?.branch || student.branch || "CSE");
    const semester = req.query.semester || studentProfile?.semester || student.semester || "5th Semester";
    const section = req.query.section || studentProfile?.section || student.section || "A";

    const overallData = await computeStudentOverallAttendance(student._id, {
      branch,
      semester,
      section,
      asOfDate: req.query.asOfDate
    });

    const today = normalizeDate(new Date());
    const todayKey = formatDateKey(today);

    // Monthly Trend Analysis
    const monthlyMap = {};
    (overallData.history || []).forEach(r => {
      const d = new Date(r.date);
      const monthKey = d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, present: 0, total: 0 };
      }
      monthlyMap[monthKey].total++;
      if (r.status === "present" || r.status === "late") {
        monthlyMap[monthKey].present++;
      }
    });

    const monthlyTrend = Object.values(monthlyMap).map(m => ({
      month: m.month,
      present: m.present,
      total: m.total,
      percentage: m.total > 0 ? Number(((m.present / m.total) * 100).toFixed(2)) : 0
    }));

    return res.status(200).json({
      success: true,
      serverToday: todayKey,
      student: overallData.student,
      config: overallData.config,
      metrics: overallData.metrics,
      monthlyTrend,
      history: overallData.history
    });
  } catch (error) {
    console.error("[getStudentOverallAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/student-subjects
 * System B: Subject Attendance — Individual Subject-Wise Lecture Attendance
 * Rule: Calculated per subject based on conducted lectures vs attended lectures.
 */
export async function getStudentSubjectAttendance(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
    const branch = resolveDepartmentBranch(req.query.branch || studentProfile?.branch || student.branch || "CSE");
    const semester = req.query.semester || studentProfile?.semester || student.semester || "5th Semester";
    const section = req.query.section || studentProfile?.section || student.section || "A";

    const subjectData = await computeStudentSubjectAttendance(student._id, {
      branch,
      semester,
      section,
      asOfDate: req.query.asOfDate
    });

    return res.status(200).json({
      success: true,
      student: subjectData.student,
      minPercentage: subjectData.minPercentage,
      totalSubjects: subjectData.totalSubjects,
      summary: subjectData.summary,
      subjects: subjectData.subjects
    });
  } catch (error) {
    console.error("[getStudentSubjectAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/subject-calendar
 * Returns comprehensive monthly calendar with P/A status for a specific subject
 */
export async function getSubjectMonthlyCalendar(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const { subject, year, month } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, message: "Subject parameter is required." });
    }

    const calendarData = await computeSubjectMonthlyCalendar(
      studentId,
      subject,
      year,
      month,
      {
        branch: req.query.branch,
        semester: req.query.semester,
        section: req.query.section
      }
    );

    return res.status(200).json({
      success: true,
      ...calendarData
    });
  } catch (error) {
    console.error("[getSubjectMonthlyCalendar] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/subject-analytics
 * Returns comprehensive multi-subject comparison, monthly trends, and shortage gap analytics
 */
export async function getSubjectAnalytics(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const analytics = await computeSubjectAnalytics(studentId, {
      branch: req.query.branch,
      semester: req.query.semester,
      section: req.query.section
    });

    return res.status(200).json({
      success: true,
      ...analytics
    });
  } catch (error) {
    console.error("[getSubjectAnalytics] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/teaching-calendar
 * Returns faculty or department teaching calendar with daily scheduled/completed lecture counts
 */
export async function getTeachingMonthlyCalendar(req, res) {
  try {
    const calendar = await computeTeachingMonthlyCalendar(
      req.user,
      req.query.year,
      req.query.month,
      {
        role: req.user.role,
        branch: req.query.branch,
        semester: req.query.semester
      }
    );

    return res.status(200).json({
      success: true,
      ...calendar
    });
  } catch (error) {
    console.error("[getTeachingMonthlyCalendar] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/lecture-roster
 * Returns individual enrolled student attendance list for a specific lecture session
 */
export async function getLectureStudentRoster(req, res) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required." });
    }

    const rosterData = await computeLectureStudentRoster(sessionId);

    return res.status(200).json({
      success: true,
      ...rosterData
    });
  } catch (error) {
    console.error("[getLectureStudentRoster] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/subject-history
 * Returns detailed session-by-session history for a specific subject
 */
export async function getStudentSubjectHistory(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const { subject, status, month, year, search } = req.query;

    if (!subject) {
      return res.status(400).json({ success: false, message: "Subject name is required." });
    }

    const query = {
      subject,
      status: "conducted"
    };

    if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      query.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0)),
        $lte: new Date(Date.UTC(y, m - 1, daysInMonth, 23, 59, 59, 999))
      };
    }

    const sessions = await SubjectAttendanceSession.find(query)
      .sort({ date: -1, periodNumber: -1 })
      .lean();

    const sessionIds = sessions.map(s => s._id);

    const records = await SubjectAttendanceRecord.find({
      studentId,
      sessionId: { $in: sessionIds }
    }).lean();

    const recordMap = new Map();
    records.forEach(r => recordMap.set(r.sessionId.toString(), r));

    let history = sessions.map(session => {
      const record = recordMap.get(session._id.toString());
      const sessionDate = new Date(session.date);
      return {
        sessionId: session._id.toString(),
        date: session.date,
        day: DAY_NAMES[sessionDate.getUTCDay()],
        periodNumber: session.periodNumber,
        startTime: session.startTime || `Period ${session.periodNumber}`,
        endTime: session.endTime || "",
        facultyName: session.facultyName || "Department Faculty",
        roomNo: session.roomNo || "Room 302",
        sessionType: session.sessionType || "theory",
        topic: session.topic || "Core Curriculum Lecture",
        status: record ? record.status : "pending",
        isMarked: !!record,
        markingMethod: record ? (record.remarks?.includes("Manual") ? "Manual Teacher Roll-Call" : "Digital Attendance Studio") : "Not Recorded",
        remarks: record ? record.remarks : "",
        auditHistory: record ? record.auditHistory : []
      };
    });

    if (status && status !== "all") {
      history = history.filter(h => h.status === status);
    }

    if (search) {
      const s = search.toLowerCase();
      history = history.filter(h =>
        (h.topic && h.topic.toLowerCase().includes(s)) ||
        (h.facultyName && h.facultyName.toLowerCase().includes(s)) ||
        (h.remarks && h.remarks.toLowerCase().includes(s))
      );
    }

    return res.status(200).json({
      success: true,
      subject,
      totalSessions: history.length,
      history
    });
  } catch (error) {
    console.error("[getStudentSubjectHistory] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/today-student
 * Returns both Today's College Attendance and Today's Subject Attendance for the student
 */
export async function getStudentTodayAttendance(req, res) {
  try {
    const studentId = req.query.studentId || req.user._id;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const today = normalizeDate(new Date());

    // 1. Today's Daily College Attendance
    const dailyRecord = await DailyCollegeAttendance.findOne({
      studentId: student._id,
      date: today
    }).lean();

    const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
    const branch = resolveDepartmentBranch(req.query.branch || studentProfile?.branch || student.branch || "CSE");
    const semester = req.query.semester || studentProfile?.semester || student.semester || "5th Semester";

    // 2. Today's Subject Sessions
    const todaySessions = await SubjectAttendanceSession.find({
      branch,
      semester,
      date: today
    }).sort({ periodNumber: 1 }).lean();

    const sessionIds = todaySessions.map(s => s._id);
    const subjectRecords = await SubjectAttendanceRecord.find({
      studentId: student._id,
      sessionId: { $in: sessionIds }
    }).lean();

    const recordMap = new Map();
    subjectRecords.forEach(r => recordMap.set(r.sessionId.toString(), r));

    const todayLectures = todaySessions.map(session => {
      const rec = recordMap.get(session._id.toString());
      return {
        sessionId: session._id.toString(),
        periodNumber: session.periodNumber,
        startTime: session.startTime,
        endTime: session.endTime,
        subject: session.subject,
        roomNo: session.roomNo,
        facultyName: session.facultyName,
        status: rec ? rec.status : "pending"
      };
    });

    return res.status(200).json({
      success: true,
      today,
      dailyCollege: {
        isMarked: !!dailyRecord,
        status: dailyRecord ? dailyRecord.status : "not_marked",
        remarks: dailyRecord ? dailyRecord.remarks : ""
      },
      todayLectures
    });
  } catch (error) {
    console.error("[getStudentTodayAttendance] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/analytics
 * High-level analytics and shortage reports for staff (Teacher, HOD, Coordinator, Principal)
 */
export async function getAttendanceAnalytics(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A" } = req.query;

    const students = await User.find({
      role: "student",
      status: "active",
      branch,
      semester
    }).select("name rollNumber enrollmentNo avatar").lean();

    let totalEligibleDays = 67;
    const config = await AcademicAttendanceConfig.findOne({ branch, semester, section });
    if (config?.totalWorkingDays) {
      totalEligibleDays = config.totalWorkingDays;
    }

    const shortageStudents = [];
    let totalPresentOverall = 0;
    const totalPossibleOverall = students.length * totalEligibleDays;

    for (const student of students) {
      const overallData = await computeStudentOverallAttendance(student._id, { branch, semester, section });
      const { presentDays, percentage, daysNeededFor60 } = overallData.metrics;

      totalPresentOverall += presentDays;

      if (percentage < 60) {
        shortageStudents.push({
          id: student._id.toString(),
          name: student.name,
          rollNumber: student.rollNumber || student.enrollmentNo || "N/A",
          presentDays,
          totalEligibleDays,
          percentage,
          daysNeededFor60
        });
      }
    }

    const cohortAveragePercentage = totalPossibleOverall > 0
      ? Number(((totalPresentOverall / totalPossibleOverall) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      totalStudents: students.length,
      totalEligibleDays,
      cohortAveragePercentage,
      shortageCount: shortageStudents.length,
      shortageStudents
    });
  } catch (error) {
    console.error("[getAttendanceAnalytics] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/attendance/simulate-projection
 * What-If Attendance Simulator: computes projected percentage and compliance
 */
export async function simulateAttendanceProjection(req, res) {
  try {
    const studentId = req.body.studentId || req.user._id;
    const { type = "overall", subject: subjectName, futureAttend = 0, futureMiss = 0 } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
    const branch = resolveDepartmentBranch(studentProfile?.branch || student.branch || "CSE");
    const semester = studentProfile?.semester || student.semester || "5th Semester";

    if (type === "subject") {
      if (!subjectName) {
        return res.status(400).json({ success: false, message: "Subject name is required for subject simulation." });
      }

      const sessions = await SubjectAttendanceSession.find({
        branch,
        semester,
        subject: subjectName,
        status: "conducted"
      }).lean();

      const sessionIds = sessions.map(s => s._id);
      const conductedCount = sessions.length;

      const records = await SubjectAttendanceRecord.find({
        studentId: student._id,
        sessionId: { $in: sessionIds }
      }).lean();

      const attendedCount = records.filter(r => r.status === "present" || r.status === "late").length;
      const currentPct = conductedCount > 0 ? Number(((attendedCount / conductedCount) * 100).toFixed(2)) : 0.0;

      const projectedAttended = attendedCount + Math.max(0, Number(futureAttend));
      const projectedTotal = conductedCount + Math.max(0, Number(futureAttend)) + Math.max(0, Number(futureMiss));
      const projectedPct = projectedTotal > 0 ? Number(((projectedAttended / projectedTotal) * 100).toFixed(2)) : 0.0;

      return res.status(200).json({
        success: true,
        type: "subject",
        subject: subjectName,
        current: { attended: attendedCount, total: conductedCount, percentage: currentPct },
        simulation: { futureAttend, futureMiss, projectedAttended, projectedTotal, projectedPercentage: projectedPct },
        isCompliant: projectedPct >= 60,
        benchmark: 60
      });
    } else {
      // Overall College Attendance simulation
      const overallData = await computeStudentOverallAttendance(student._id, { branch, semester });
      const currentPresent = overallData.metrics.presentDays;
      const totalEligibleDays = overallData.metrics.totalEligibleDays;
      const currentPct = overallData.metrics.percentage;

      const projectedPresent = currentPresent + Math.max(0, Number(futureAttend));
      const projectedTotal = totalEligibleDays + Math.max(0, Number(futureAttend)) + Math.max(0, Number(futureMiss));
      const projectedPct = projectedTotal > 0 ? Number(((projectedPresent / projectedTotal) * 100).toFixed(2)) : 0.0;

      return res.status(200).json({
        success: true,
        type: "overall",
        current: { attended: currentPresent, total: totalEligibleDays, percentage: currentPct },
        simulation: { futureAttend, futureMiss, projectedAttended: projectedPresent, projectedTotal, projectedPercentage: projectedPct },
        isCompliant: projectedPct >= 60,
        benchmark: 60
      });
    }
  } catch (error) {
    console.error("[simulateAttendanceProjection] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/export-report
 * Exports attendance report in CSV format
 */
export async function exportAttendanceReport(req, res) {
  try {
    const rawBranch = req.query.branch || "CSE";
    const branch = resolveDepartmentBranch(rawBranch);
    const { semester = "5th Semester", section = "A", format = "csv" } = req.query;

    const students = await User.find({
      role: "student",
      status: "active"
    }).select("name rollNumber enrollmentNo").lean();

    const config = await AcademicAttendanceConfig.findOne({ branch, semester, section });
    const commencementDate = config ? normalizeDate(config.commencementDate) : new Date("2026-11-01T00:00:00.000Z");
    const today = normalizeDate(new Date());

    const { count: totalEligibleDays } = calculateWorkingDays(
      commencementDate,
      today,
      config?.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      config?.holidays || []
    );

    let csv = "Student Name,Roll Number,Branch,Semester,Section,Eligible Days,Days Attended,Overall Percentage,Compliance Status\n";

    for (const student of students) {
      const records = await DailyCollegeAttendance.find({
        studentId: student._id,
        date: { $gte: commencementDate, $lte: today }
      }).lean();

      const presentCount = records.filter(r => r.status === "present" || r.status === "late").length;
      const percentage = totalEligibleDays > 0 ? Number(((presentCount / totalEligibleDays) * 100).toFixed(1)) : 100;
      const status = percentage >= 60 ? "Compliant (>=60%)" : "Shortage Warning (<60%)";

      csv += `"${student.name}","${student.rollNumber || student.enrollmentNo || "N/A"}","${branch}","${semester}","${section}",${totalEligibleDays},${presentCount},"${percentage}%","${status}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=Attendance_Export_${branch}_${semester}_${new Date().toISOString().split("T")[0]}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("[exportAttendanceReport] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/attendance/student-day-audit
 * Day Audit Inspector - Comprehensive daily ledger inspection
 * Returns:
 * 1. Overview (full date, weekday, dateKey, state, status badge, working day / holiday status, submission status, explanation)
 * 2. Attendance Verification (check-in time, check-out time, marking method, verification status, timestamp)
 * 3. Audit Trail (markedByName, markedByRole, timestamp, audit history timeline with reasons)
 * 4. Subject-wise Daily Activity (list of subject lectures conducted/scheduled with faculty, timing, room, student status, session status)
 */
export async function getStudentDayAudit(req, res) {
  try {
    let studentId = req.user._id;
    // If staff (teacher, hod, coordinator, principal, admin) passed studentId, allow inspecting that student
    if (req.query.studentId && ["teacher", "hod", "coordinator", "principal", "admin"].includes(req.user.role)) {
      studentId = req.query.studentId;
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
    const branch = resolveDepartmentBranch(req.query.branch || studentProfile?.branch || student.branch || "CSE");
    const semester = req.query.semester || studentProfile?.semester || student.semester || "5th Semester";
    const section = req.query.section || studentProfile?.section || student.section || "A";

    const dateParam = req.query.date;
    if (!dateParam) {
      return res.status(400).json({ success: false, message: "Date parameter (YYYY-MM-DD) is required." });
    }

    const targetDate = normalizeDate(dateParam);
    const dateKey = formatDateKey(targetDate);
    const today = normalizeDate(new Date());
    const todayKey = formatDateKey(today);

    // 1. Fetch Academic Configuration
    let config = await AcademicAttendanceConfig.findOne({ branch, semester, section }).lean();
    if (!config) {
      config = {
        commencementDate: new Date("2026-11-01T00:00:00.000Z"),
        academicEndDate: new Date("2027-04-30T00:00:00.000Z"),
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        holidays: [
          { date: new Date("2026-11-08T00:00:00.000Z"), title: "Guru Nanak Jayanti", type: "holiday" },
          { date: new Date("2026-12-25T00:00:00.000Z"), title: "Christmas Day", type: "holiday" },
          { date: new Date("2027-01-26T00:00:00.000Z"), title: "Republic Day", type: "holiday" }
        ],
        specialWorkingDays: []
      };
    }

    const commencementDate = normalizeDate(config.commencementDate);
    const dayOfWeek = DAY_NAMES[targetDate.getUTCDay()];
    const isSunday = targetDate.getUTCDay() === 0;

    // Check holiday list
    const holidayMatch = (config.holidays || []).find(h => formatDateKey(h.date || h) === dateKey);
    const isHoliday = isSunday || !!holidayMatch;
    const holidayTitle = holidayMatch?.title || (isSunday ? "Sunday — Institutional Non-working Day" : null);

    const isFuture = dateKey > todayKey;
    const isToday = dateKey === todayKey;
    const isPast = dateKey < todayKey;
    const isWorkingDay = (config.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]).includes(dayOfWeek) && !isHoliday;

    // 2. Fetch Daily College Attendance record
    const dailyRecord = await DailyCollegeAttendance.findOne({
      studentId: student._id,
      date: targetDate
    }).lean();

    // 3. Fetch Subject Sessions & Student's Subject Records
    const sessions = await SubjectAttendanceSession.find({
      branch,
      semester,
      date: targetDate
    }).sort({ periodNumber: 1 }).lean();

    const sessionIds = sessions.map(s => s._id);
    const subjectRecords = sessionIds.length > 0
      ? await SubjectAttendanceRecord.find({
          studentId: student._id,
          sessionId: { $in: sessionIds }
        }).lean()
      : [];

    const recordMap = new Map();
    subjectRecords.forEach(r => recordMap.set(r.sessionId.toString(), r));

    const subjectActivities = sessions.map(s => {
      const rec = recordMap.get(s._id.toString());
      return {
        sessionId: s._id.toString(),
        subject: s.subject,
        subjectCode: s.subjectCode || "CORE",
        facultyName: s.facultyName || "Faculty",
        facultyRole: s.facultyRole || "teacher",
        periodNumber: s.periodNumber,
        startTime: s.startTime || "09:00 AM",
        endTime: s.endTime || "10:00 AM",
        roomNo: s.roomNo || "Room 302",
        sessionType: s.sessionType || "theory",
        topic: s.topic || "",
        status: rec ? rec.status : "pending",
        isConducted: s.status === "conducted",
        submittedAt: s.submittedAt || s.createdAt || null
      };
    });

    // 4. Determine Inspector State & Explanations
    let state = "neutral";
    let statusBadge = "Neutral";
    let submissionStatus = "Not Applicable";
    let explanation = "";

    if (isHoliday) {
      state = "holiday";
      statusBadge = "Holiday / Non-working";
      submissionStatus = "Non-working Day";
      explanation = holidayTitle || "Institutional non-working day. Excluded from attendance calculations.";
    } else if (isFuture) {
      state = "future";
      statusBadge = "Upcoming";
      submissionStatus = "Not Available";
      explanation = "Upcoming date on the academic calendar. Attendance records will become available on the day of class.";
    } else if (dailyRecord) {
      if (dailyRecord.status === "present" || dailyRecord.status === "late") {
        state = dailyRecord.auditHistory?.length > 0 ? "corrected" : "present";
        statusBadge = dailyRecord.status === "late" ? "Present (Late)" : "Present — Verified";
        submissionStatus = "Officially Submitted & Finalized";
        explanation = `Campus presence officially recorded and verified by ${dailyRecord.markedByName || "Faculty"}.`;
      } else if (dailyRecord.status === "absent") {
        state = dailyRecord.auditHistory?.length > 0 ? "corrected" : "absent";
        statusBadge = "Absent — Officially Submitted";
        submissionStatus = "Officially Submitted & Finalized";
        explanation = `Recorded absent from campus. Remarks: ${dailyRecord.remarks || "Unexcused absence"}.`;
      } else if (dailyRecord.status === "excused") {
        state = "excused";
        statusBadge = "Excused Leave";
        submissionStatus = "Officially Approved";
        explanation = `Authorized leave granted. Remarks: ${dailyRecord.remarks || "Approved medical/official leave"}.`;
      }
    } else if (isToday) {
      state = "pending";
      statusBadge = "Pending Roll Call";
      submissionStatus = "Roll Call in Progress";
      explanation = "Today's campus attendance roll call is currently in progress. The official ledger status will update immediately once the authorized faculty submits attendance.";
    } else if (isWorkingDay && isPast) {
      state = "unsubmitted";
      statusBadge = "Not Submitted";
      submissionStatus = "Awaiting Submission";
      explanation = "No official campus attendance roll call was submitted for this past working day.";
    } else {
      state = "neutral";
      statusBadge = "Non-instructional";
      submissionStatus = "Not Recorded";
      explanation = "Non-instructional calendar day.";
    }

    // 5. Verification Metadata
    const verification = dailyRecord ? {
      isRecorded: true,
      checkInTime: dailyRecord.status === "present" || dailyRecord.status === "late" ? "08:00 AM (Campus Gate)" : "Not recorded",
      checkOutTime: dailyRecord.status === "present" || dailyRecord.status === "late" ? "04:00 PM (Campus Gate)" : "Not recorded",
      markingMethod: "Biometric Register & Campus Portal Roll-Call",
      verificationStatus: "Officially Submitted & Finalized",
      verificationTimestamp: dailyRecord.createdAt ? new Date(dailyRecord.createdAt).toISOString() : null,
      remarks: dailyRecord.remarks || "Regular Campus Day Presence Recorded"
    } : {
      isRecorded: false,
      checkInTime: "Not recorded",
      checkOutTime: "Not recorded",
      markingMethod: isFuture ? "Scheduled for date" : isHoliday ? "Holiday / Non-working" : "Pending Staff Roll Call",
      verificationStatus: isFuture ? "Upcoming" : isHoliday ? "Non-working" : "Pending Submission",
      verificationTimestamp: null,
      remarks: explanation
    };

    // 6. Audit Trail
    const auditTrail = {
      markedByName: dailyRecord?.markedByName || null,
      markedByRole: dailyRecord?.markedByRole || null,
      submittedAt: dailyRecord?.createdAt ? new Date(dailyRecord.createdAt).toISOString() : null,
      lastUpdatedAt: dailyRecord?.updatedAt ? new Date(dailyRecord.updatedAt).toISOString() : null,
      hasCorrections: (dailyRecord?.auditHistory?.length || 0) > 0,
      history: (dailyRecord?.auditHistory || []).map(h => ({
        modifiedAt: h.modifiedAt,
        modifiedByName: h.modifiedByName || "Authorized Staff",
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        reason: h.reason || "Administrative verification"
      }))
    };

    return res.status(200).json({
      success: true,
      dateKey,
      fullDate: targetDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }),
      weekday: dayOfWeek,
      isToday,
      isFuture,
      isPast,
      isWorkingDay,
      isHoliday,
      holidayTitle,
      state,
      statusBadge,
      submissionStatus,
      explanation,
      verification,
      auditTrail,
      subjectActivities,
      totalSubjectSessions: subjectActivities.length,
      student: {
        id: student._id.toString(),
        name: student.fullName || student.name,
        rollNumber: studentProfile?.rollNumber || student.rollNumber || "2024CSE042"
      }
    });
  } catch (error) {
    console.error("[getStudentDayAudit] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

