import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import AcademicAttendanceConfig from "../models/AcademicAttendanceConfig.js";
import SubjectAttendanceSession from "../models/SubjectAttendanceSession.js";
import SubjectAttendanceRecord from "../models/SubjectAttendanceRecord.js";
import DailyCollegeAttendance from "../models/DailyCollegeAttendance.js";
import Subject from "../models/Subject.js";
import { resolveDepartmentBranch } from "../utils/validators.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function normalizeDate(dateInput) {
  if (!dateInput) return new Date();
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function formatDateKey(dateInput) {
  return normalizeDate(dateInput).toISOString().split("T")[0];
}

/**
 * Pure calculation: Subject Attendance Percentage
 * Formula: (Attended Subject Lectures / Total Officially Conducted Subject Lectures) * 100
 * Formatted to 2 decimal places. Safely handles zero denominator.
 */
export function calculateSubjectAttendancePercentage(attended, conducted) {
  const att = Number(attended) || 0;
  const cond = Number(conducted) || 0;
  if (cond <= 0) return 0.0;
  return Number(((att / cond) * 100).toFixed(2));
}

/**
 * Pure calculation: Overall College Attendance Percentage
 * Formula: (Unique College Days Present / Total Eligible College Working Days) * 100
 * Formatted to 2 decimal places. Safely handles zero denominator.
 */
export function calculateOverallAttendancePercentage(uniquePresentDays, totalWorkingDays) {
  const pres = Number(uniquePresentDays) || 0;
  const tot = Number(totalWorkingDays) || 0;
  if (tot <= 0) return 0.0;
  return Number(((pres / tot) * 100).toFixed(2));
}

/**
 * Computes consecutive sessions/days needed to reach the 60% compliance benchmark:
 * (attended + X) / (total + X) >= targetPct / 100
 * => X >= (targetRatio * total - attended) / (1 - targetRatio)
 */
export function calculateDeficitToTarget(attended, total, targetPct = 60) {
  const att = Number(attended) || 0;
  const tot = Number(total) || 0;
  const ratio = (Number(targetPct) || 60) / 100;
  if (tot <= 0) return 0;
  const currentPct = (att / tot) * 100;
  if (currentPct >= targetPct) return 0;
  const required = (ratio * tot - att) / (1 - ratio);
  return Math.max(0, Math.ceil(required));
}

/**
 * Calculate working days between two dates considering institutional holidays and working days.
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

  if (start > end) return { count: 0, dateList: [] };

  const holidayDateStrings = new Set(
    (holidays || []).map(h => formatDateKey(h.date || h))
  );
  const specialDateStrings = new Set(
    (specialWorkingDays || []).map(s => formatDateKey(s.date || s))
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

    if (isSpecial || (isRegularWorking && !isHoliday)) {
      count++;
      dateList.push(new Date(current));
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { count, dateList };
}

/**
 * ENGINE A: Subject Attendance Engine
 * Computes individual subject lecture metrics for a student.
 * - Counts individual officially conducted subject lectures (excluding cancelled, pending, future).
 * - Deduplicates attendance records to prevent duplicates.
 */
export async function computeStudentSubjectAttendance(studentId, options = {}) {
  const student = await User.findById(studentId);
  if (!student) throw new Error("Student not found.");

  const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
  const branch = resolveDepartmentBranch(options.branch || studentProfile?.branch || student.branch || "CSE");
  const semester = options.semester || studentProfile?.semester || student.semester || "5th Semester";
  const section = options.section || studentProfile?.section || student.section || "A";

  let config = await AcademicAttendanceConfig.findOne({ branch, semester, section }).lean();
  if (!config) {
    config = await AcademicAttendanceConfig.findOne({ branch, semester }).lean();
  }

  const commencementDate = config?.commencementDate
    ? normalizeDate(config.commencementDate)
    : normalizeDate("2026-11-01T00:00:00.000Z");

  const today = normalizeDate(new Date());
  let evalDate = options.asOfDate ? normalizeDate(options.asOfDate) : today;
  if (!options.asOfDate && evalDate > today) {
    evalDate = today;
  }

  // 1. Fetch Curriculum Subjects
  const curriculumSubjects = await Subject.find({ branch, semester }).lean();
  const sessionSubjects = await SubjectAttendanceSession.distinct("subject", { branch, semester });

  const subjectNames = Array.from(new Set([
    ...curriculumSubjects.map(s => s.subjectName || s.name),
    ...sessionSubjects
  ])).filter(Boolean);

  const allSubjects = subjectNames.length > 0 ? subjectNames : [
    "Operating Systems",
    "Database Management Systems",
    "Advanced Computer Networks",
    "OOPS with Java",
    "Internet of Things",
    "Management & Technology",
    "Indian Constitution",
    "SCA"
  ];

  const subjectMetrics = [];

  for (const subName of allSubjects) {
    const curriculumInfo = curriculumSubjects.find(s => (s.subjectName || s.name) === subName);

    // Find all officially conducted lecture sessions strictly between commencementDate and evalDate
    // Exclude cancelled sessions and future sessions
    const sessions = await SubjectAttendanceSession.find({
      branch,
      semester,
      subject: subName,
      status: "conducted",
      date: { $gte: commencementDate, $lte: evalDate }
    }).sort({ date: 1, periodNo: 1 }).lean();

    const sessionIds = sessions.map(s => s._id);
    const conductedCount = sessions.length;

    // Find student attendance records for these sessions
    const rawRecords = await SubjectAttendanceRecord.find({
      studentId: student._id,
      sessionId: { $in: sessionIds }
    }).lean();

    // Deduplicate records by sessionId (latest status wins)
    const recordBySession = new Map();
    for (const r of rawRecords) {
      recordBySession.set(r.sessionId.toString(), r);
    }

    let attendedCount = 0;
    let absentCount = 0;

    for (const s of sessions) {
      const rec = recordBySession.get(s._id.toString());
      if (rec) {
        if (rec.status === "present" || rec.status === "late") {
          attendedCount++;
        } else if (rec.status === "absent") {
          absentCount++;
        }
      }
      // If no record, it's considered unrecorded / pending, NOT automatically absent
    }

    const percentage = calculateSubjectAttendancePercentage(attendedCount, conductedCount);
    const minPercentage = config?.minAttendancePercentage || 60;
    const meetsMinimum = percentage >= minPercentage;
    const lecturesNeededFor60 = calculateDeficitToTarget(attendedCount, conductedCount, minPercentage);

    // Determine planned semester lectures from subject, config, or timetable
    let plannedCount = curriculumInfo?.plannedLectures;
    if (!plannedCount && config?.subjectPlannedLectures && Array.isArray(config.subjectPlannedLectures)) {
      const confSub = config.subjectPlannedLectures.find(cs => cs.subject === subName);
      if (confSub) plannedCount = confSub.plannedLectures;
    }
    if (!plannedCount && config?.defaultPlannedLecturesPerSubject) {
      plannedCount = config.defaultPlannedLecturesPerSubject;
    }
    // If still not found, check hoursPerWeek or default to 33
    if (!plannedCount && curriculumInfo?.hoursPerWeek) {
      plannedCount = 33;
    }

    const plannedConfigured = typeof plannedCount === "number" && plannedCount > 0;
    const plannedPercentage = plannedConfigured
      ? calculateSubjectAttendancePercentage(attendedCount, plannedCount)
      : null;

    const latestSession = sessions[sessions.length - 1];

    subjectMetrics.push({
      subjectName: subName,
      subjectCode: curriculumInfo?.subjectCode || curriculumInfo?.code || latestSession?.subjectCode || "",
      facultyName: curriculumInfo?.teacherName || latestSession?.facultyName || "Department Faculty",
      roomNo: latestSession?.roomNo || "Room 302",
      conductedCount,
      attendedCount,
      absentCount,
      percentage, // Conducted-to-date percentage
      conductedPercentage: percentage,
      plannedCount: plannedConfigured ? plannedCount : null,
      plannedPercentage,
      plannedConfigured,
      meetsMinimum,
      status: meetsMinimum ? "On Track" : "Shortage Warning",
      lecturesNeededFor60,
      displayRatio: plannedConfigured
        ? `${attendedCount} / ${conductedCount} conducted (${percentage.toFixed(2)}%) • ${attendedCount} / ${plannedCount} planned (${plannedPercentage.toFixed(2)}%)`
        : `${attendedCount} / ${conductedCount} lectures attended — ${percentage.toFixed(2)}%`,
      credits: curriculumInfo?.credits || 4
    });
  }

  const totalConducted = subjectMetrics.reduce((sum, s) => sum + s.conductedCount, 0);
  const totalAttended = subjectMetrics.reduce((sum, s) => sum + s.attendedCount, 0);
  const totalAbsent = subjectMetrics.reduce((sum, s) => sum + s.absentCount, 0);
  const totalPlanned = subjectMetrics.reduce((sum, s) => sum + (s.plannedCount || 0), 0);
  const allPlannedConfigured = subjectMetrics.every(s => s.plannedConfigured);

  return {
    student: {
      id: student._id.toString(),
      name: student.fullName || student.name,
      rollNumber: studentProfile?.rollNumber || student.rollNumber || student.enrollmentNo || "2024CSE042",
      branch,
      semester,
      section
    },
    minPercentage: config?.minAttendancePercentage || 60,
    totalSubjects: subjectMetrics.length,
    summary: {
      totalEnrolledSubjects: subjectMetrics.length,
      totalConductedLectures: totalConducted,
      totalAttendedLectures: totalAttended,
      totalAbsentLectures: totalAbsent,
      totalPlannedLectures: totalPlanned,
      allPlannedConfigured,
      overallConductedPercentage: totalConducted > 0 ? Number(((totalAttended / totalConducted) * 100).toFixed(2)) : 0.0,
      overallPlannedPercentage: totalPlanned > 0 ? Number(((totalAttended / totalPlanned) * 100).toFixed(2)) : null,
      below60Count: subjectMetrics.filter(s => s.percentage < 60).length,
      above60Count: subjectMetrics.filter(s => s.percentage >= 60).length,
      distinctionCount: subjectMetrics.filter(s => s.percentage >= 80).length
    },
    subjects: subjectMetrics
  };
}

/**
 * ENGINE B: Overall College Attendance Engine
 * Computes unique eligible college working days present for a student.
 * - Counts UNIQUE college working days where student attended at least 1 officially conducted lecture.
 * - Multiple lectures on the same date count as ONLY ONE overall present day.
 * - Denominator is based on institutional semester configuration (e.g. 67 eligible working days).
 */
export async function computeStudentOverallAttendance(studentId, options = {}) {
  const student = await User.findById(studentId);
  if (!student) throw new Error("Student not found.");

  const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
  const branch = resolveDepartmentBranch(options.branch || studentProfile?.branch || student.branch || "CSE");
  const semester = options.semester || studentProfile?.semester || student.semester || "5th Semester";
  const section = options.section || studentProfile?.section || student.section || "A";

  // 1. Fetch Academic Configuration
  let config = await AcademicAttendanceConfig.findOne({ branch, semester, section }).lean();
  if (!config) {
    config = await AcademicAttendanceConfig.findOne({ branch, semester }).lean();
  }

  if (!config) {
    config = {
      commencementDate: new Date("2026-11-01T00:00:00.000Z"),
      academicEndDate: new Date("2027-04-30T00:00:00.000Z"),
      totalWorkingDays: 67,
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

  const commencementDate = normalizeDate(config.commencementDate);
  const today = normalizeDate(new Date());
  const todayKey = formatDateKey(today);

  let evalDate = options.asOfDate ? normalizeDate(options.asOfDate) : today;
  if (!options.asOfDate && evalDate > today) {
    evalDate = today;
  }

  // 2. Working days completed to date
  const { count: completedCalendarWorkingDays, dateList } = calculateWorkingDays(
    commencementDate,
    evalDate,
    config.workingDays,
    config.holidays,
    config.specialWorkingDays
  );

  const holidayDateSet = new Set(
    (config.holidays || []).map(h => formatDateKey(h.date || h))
  );

  // 3. Fetch Subject Sessions & Student Subject Records
  // Rule: If a student attends at least one officially conducted subject lecture on a particular eligible
  // college working day, that day counts as ONE overall Present day.
  const conductedSessions = await SubjectAttendanceSession.find({
    branch,
    semester,
    status: "conducted",
    date: { $gte: commencementDate, $lte: evalDate }
  }).lean();

  const sessionMap = new Map();
  for (const s of conductedSessions) {
    sessionMap.set(s._id.toString(), s);
  }

  const subjectRecords = await SubjectAttendanceRecord.find({
    studentId: student._id,
    sessionId: { $in: Array.from(sessionMap.keys()) }
  }).lean();

  // Deduplicate records and map to date
  const uniquePresentDates = new Set();
  const uniqueAbsentDatesCandidate = new Set();
  const dateToSessionRecords = new Map();

  for (const rec of subjectRecords) {
    const session = sessionMap.get(rec.sessionId.toString());
    if (!session) continue;
    const dateKey = formatDateKey(session.date);

    // Skip holidays and non-working days
    if (holidayDateSet.has(dateKey)) continue;
    const dObj = new Date(session.date);
    const dayName = DAY_NAMES[dObj.getUTCDay()];
    if (!(config.workingDays || []).includes(dayName)) continue;

    if (!dateToSessionRecords.has(dateKey)) {
      dateToSessionRecords.set(dateKey, []);
    }
    dateToSessionRecords.get(dateKey).push(rec);

    if (rec.status === "present" || rec.status === "late") {
      uniquePresentDates.add(dateKey);
    }
  }

  // Also include valid DailyCollegeAttendance records (if any verified separately)
  const dailyRecords = await DailyCollegeAttendance.find({
    studentId: student._id,
    date: { $gte: commencementDate, $lte: evalDate }
  }).sort({ date: -1 }).lean();

  for (const d of dailyRecords) {
    const dateKey = formatDateKey(d.date);
    if (holidayDateSet.has(dateKey)) continue;
    const dayName = DAY_NAMES[new Date(d.date).getUTCDay()];
    if (!(config.workingDays || []).includes(dayName)) continue;

    if (d.status === "present" || d.status === "late") {
      uniquePresentDates.add(dateKey);
    }
  }

  // Determine total eligible working days in the semester
  // If explicitly configured in config.totalWorkingDays, use that (e.g. 67).
  // Otherwise calculate working days between commencementDate and academicEndDate.
  let totalEligibleDays = config.totalWorkingDays;
  if (!totalEligibleDays || totalEligibleDays <= 0) {
    const { count: semesterCalcDays } = calculateWorkingDays(
      commencementDate,
      config.academicEndDate || new Date("2027-04-30T00:00:00.000Z"),
      config.workingDays,
      config.holidays,
      config.specialWorkingDays
    );
    totalEligibleDays = semesterCalcDays > 0 ? semesterCalcDays : 67;
  }

  const presentDays = uniquePresentDates.size;

  // Check if today is an active working day and has recorded attendance
  const isTodayRecorded = uniquePresentDates.has(todayKey) || dailyRecords.some(r => formatDateKey(r.date) === todayKey);
  const isTodayWorking = dateList.some(d => formatDateKey(d) === todayKey);

  // Completed working days where roll call was due/submitted
  const completedWorkingDays = (isTodayWorking && !isTodayRecorded)
    ? Math.max(1, completedCalendarWorkingDays - 1)
    : Math.max(1, completedCalendarWorkingDays);

  const absentDays = Math.max(0, completedWorkingDays - presentDays);
  const unmarkedDays = Math.max(0, totalEligibleDays - (presentDays + absentDays));

  // Percentage against total eligible working days of the semester
  const percentage = calculateOverallAttendancePercentage(presentDays, totalEligibleDays);
  const minPercentage = config.minAttendancePercentage || 60;
  const meetsMinimum = percentage >= minPercentage;

  // Term-to-date percentage (completed days so far)
  const termToDatePercentage = calculateOverallAttendancePercentage(presentDays, completedWorkingDays);

  const daysNeededFor60 = calculateDeficitToTarget(presentDays, totalEligibleDays, minPercentage);

  const { count: remainingSemesterDays } = calculateWorkingDays(
    evalDate,
    config.academicEndDate || new Date("2027-04-30T00:00:00.000Z"),
    config.workingDays,
    config.holidays,
    config.specialWorkingDays
  );

  const isAchievable = daysNeededFor60 <= remainingSemesterDays;

  return {
    student: {
      id: student._id.toString(),
      name: student.fullName || student.name,
      rollNumber: studentProfile?.rollNumber || student.rollNumber || student.enrollmentNo || "2024CSE042",
      branch,
      semester,
      section
    },
    config: {
      commencementDate: config.commencementDate,
      academicEndDate: config.academicEndDate,
      totalWorkingDays: totalEligibleDays,
      minAttendancePercentage: minPercentage,
      workingDays: config.workingDays,
      holidays: (config.holidays || []).map(h => ({
        date: formatDateKey(h.date || h),
        title: h.title || "Holiday",
        type: h.type || "holiday"
      }))
    },
    metrics: {
      totalEligibleDays,
      completedWorkingDays,
      presentDays,
      absentDays,
      excusedDays: 0,
      unmarkedDays,
      percentage,
      termToDatePercentage,
      minPercentage,
      meetsMinimum,
      status: meetsMinimum ? "Meets Minimum" : "Below Minimum",
      daysNeededFor60,
      isAchievable,
      remainingSemesterDays,
      isTodayRecorded,
      displayRatio: `${presentDays} / ${totalEligibleDays} working days present — ${percentage.toFixed(2)}%`
    },
    history: dailyRecords.map(r => ({
      id: r._id.toString(),
      date: r.date,
      day: DAY_NAMES[new Date(r.date).getUTCDay()],
      status: r.status,
      remarks: r.remarks,
      markedByName: r.markedByName
    }))
  };
}

/**
 * Computes individual subject monthly calendar with P/A status per date.
 * - Legend: P = Present (Green), A = Officially submitted Absent (Red), Pending = Amber, H = Holiday, L = Cancelled, Neutral = No lecture or future.
 * - Returns detailed session logs for clicked dates.
 */
export async function computeSubjectMonthlyCalendar(studentId, subjectName, yearInput, monthInput, options = {}) {
  const student = await User.findById(studentId);
  if (!student) throw new Error("Student not found.");

  const studentProfile = await StudentProfile.findOne({ userId: student._id }).lean();
  const branch = resolveDepartmentBranch(options.branch || studentProfile?.branch || student.branch || "CSE");
  const semester = options.semester || studentProfile?.semester || student.semester || "5th Semester";
  const section = options.section || studentProfile?.section || student.section || "A";

  let config = await AcademicAttendanceConfig.findOne({ branch, semester, section }).lean();
  if (!config) {
    config = await AcademicAttendanceConfig.findOne({ branch, semester }).lean();
  }

  const today = normalizeDate(new Date());
  const todayKey = formatDateKey(today);

  const now = new Date();
  const year = parseInt(yearInput, 10) || now.getUTCFullYear();
  const month = parseInt(monthInput, 10) || (now.getUTCMonth() + 1);

  // Month date boundaries
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

  const commencementDate = config?.commencementDate
    ? normalizeDate(config.commencementDate)
    : normalizeDate("2026-11-01T00:00:00.000Z");

  // Subject metadata
  const curriculumSubject = await Subject.findOne({
    branch,
    semester,
    $or: [{ subjectName }, { name: subjectName }]
  }).lean();

  // Find all sessions for this subject in the given month
  const sessions = await SubjectAttendanceSession.find({
    branch,
    semester,
    subject: subjectName,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).sort({ periodNumber: 1 }).lean();

  const sessionIds = sessions.map(s => s._id);
  const rawRecords = await SubjectAttendanceRecord.find({
    studentId: student._id,
    sessionId: { $in: sessionIds }
  }).lean();

  const recordsBySession = new Map();
  for (const r of rawRecords) {
    recordsBySession.set(r.sessionId.toString(), r);
  }

  // Group sessions by dateKey
  const sessionsByDate = new Map();
  for (const s of sessions) {
    const dKey = formatDateKey(s.date);
    if (!sessionsByDate.has(dKey)) {
      sessionsByDate.set(dKey, []);
    }
    sessionsByDate.get(dKey).push(s);
  }

  // Institutional holidays map
  const holidayMap = new Map();
  if (config?.holidays) {
    for (const h of config.holidays) {
      holidayMap.set(formatDateKey(h.date || h), h.title || "Institutional Holiday");
    }
  }

  let conductedInMonth = 0;
  let attendedInMonth = 0;
  let absentInMonth = 0;

  const calendarDays = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dateKey = formatDateKey(dateObj);
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday
    const dayName = DAY_NAMES[dayOfWeek];

    const isSunday = dayOfWeek === 0;
    const isHoliday = isSunday || holidayMap.has(dateKey);
    const holidayTitle = isSunday ? "Sunday Institutional Holiday" : (holidayMap.get(dateKey) || "College Holiday");
    const isFuture = dateObj > today;
    const isToday = dateKey === todayKey;
    const isPreCommencement = dateObj < commencementDate;

    const daySessions = sessionsByDate.get(dateKey) || [];
    const hasLecture = daySessions.length > 0;

    let state = "none"; // 'present', 'absent', 'partial', 'pending', 'holiday', 'cancelled', 'future', 'none'
    let indicator = null; // 'P', 'A', 'P/A', 'Pending', 'H', 'L', null

    const sessionDetails = daySessions.map(s => {
      const rec = recordsBySession.get(s._id.toString());
      return {
        sessionId: s._id.toString(),
        periodNumber: s.periodNumber,
        startTime: s.startTime || `Period ${s.periodNumber}`,
        endTime: s.endTime || "",
        roomNo: s.roomNo || "Room 302",
        facultyName: s.facultyName || "Department Faculty",
        sessionType: s.sessionType || "theory",
        topic: s.topic || "Core Curriculum Lecture",
        status: rec ? rec.status : (s.status === "cancelled" ? "cancelled" : (isFuture ? "upcoming" : "pending")),
        isCancelled: s.status === "cancelled",
        markingMethod: rec ? (rec.remarks?.includes("Manual") ? "Manual Roll-Call" : "Digital Attendance Studio") : "Not Recorded",
        submittedAt: s.submittedAt || s.createdAt,
        remarks: rec?.remarks || "",
        auditHistory: rec?.auditHistory || []
      };
    });

    if (isPreCommencement && !hasLecture) {
      state = "none";
      indicator = null;
    } else if (isHoliday && !hasLecture) {
      state = "holiday";
      indicator = "H";
    } else if (hasLecture) {
      const conductedSessions = daySessions.filter(s => s.status === "conducted");
      const cancelledSessions = daySessions.filter(s => s.status === "cancelled");

      if (conductedSessions.length === 0 && cancelledSessions.length > 0) {
        state = "cancelled";
        indicator = "L";
      } else if (isFuture) {
        state = "future";
        indicator = null;
      } else {
        // Evaluate student attendance for conducted sessions
        let presentCount = 0;
        let absentCount = 0;
        let pendingCount = 0;

        for (const cs of conductedSessions) {
          const rec = recordsBySession.get(cs._id.toString());
          if (rec) {
            if (rec.status === "present" || rec.status === "late") {
              presentCount++;
            } else if (rec.status === "absent") {
              absentCount++;
            }
          } else {
            pendingCount++;
          }
        }

        conductedInMonth += conductedSessions.length;
        attendedInMonth += presentCount;
        absentInMonth += absentCount;

        if (pendingCount > 0 && presentCount === 0 && absentCount === 0) {
          state = "pending";
          indicator = "Pending";
        } else if (presentCount > 0 && absentCount === 0) {
          state = "present";
          indicator = "P";
        } else if (absentCount > 0 && presentCount === 0) {
          state = "absent";
          indicator = "A";
        } else if (presentCount > 0 && absentCount > 0) {
          state = "partial";
          indicator = "P/A";
        } else {
          state = "pending";
          indicator = "Pending";
        }
      }
    } else if (isFuture) {
      state = "future";
      indicator = null;
    } else {
      state = "none";
      indicator = null;
    }

    calendarDays.push({
      date: dateKey,
      day,
      dayNumber: day,
      dayOfWeek,
      dayName,
      state,
      indicator,
      stateLabel: indicator,
      hasLecture,
      lectureCount: daySessions.length,
      sessions: sessionDetails,
      isHoliday,
      holidayTitle: isHoliday ? holidayTitle : null,
      isFuture,
      isToday
    });
  }

  const monthPercentage = calculateSubjectAttendancePercentage(attendedInMonth, conductedInMonth);

  // Available session months for historical navigation
  const allRecordedDates = await SubjectAttendanceSession.distinct("date", {
    branch,
    semester,
    subject: subjectName
  });

  const availableMonthsMap = new Map();
  for (let m = 9; m <= 12; m++) {
    availableMonthsMap.set(`2026-${m.toString().padStart(2, "0")}`, {
      year: 2026,
      month: m,
      monthName: new Date(Date.UTC(2026, m - 1, 1)).toLocaleString("en-IN", { month: "long" }),
      hasRecords: false
    });
  }

  for (const d of allRecordedDates) {
    const dObj = new Date(d);
    const key = `${dObj.getUTCFullYear()}-${(dObj.getUTCMonth() + 1).toString().padStart(2, "0")}`;
    if (!availableMonthsMap.has(key)) {
      availableMonthsMap.set(key, {
        year: dObj.getUTCFullYear(),
        month: dObj.getUTCMonth() + 1,
        monthName: dObj.toLocaleString("en-IN", { month: "long" }),
        hasRecords: true
      });
    } else {
      availableMonthsMap.get(key).hasRecords = true;
    }
  }

  const availableMonths = Array.from(availableMonthsMap.values()).sort((a, b) => {
    return a.year !== b.year ? a.year - b.year : a.month - b.month;
  });

  return {
    subject: {
      subjectName,
      subjectCode: curriculumSubject?.subjectCode || curriculumSubject?.code || "",
      facultyName: curriculumSubject?.assignedTeacherName || "Department Faculty",
      roomNo: curriculumSubject?.preferredRoomType || "Room 302",
      credits: curriculumSubject?.credits || 4
    },
    year,
    month,
    monthName: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-IN", { month: "long" }),
    daysInMonth,
    calendarDays,
    monthSummary: {
      conductedInMonth,
      attendedInMonth,
      absentInMonth,
      percentageInMonth: monthPercentage,
      displayRatio: `${attendedInMonth} / ${conductedInMonth} lectures — ${monthPercentage.toFixed(2)}%`
    },
    availableMonths,
    commencementDate: formatDateKey(commencementDate)
  };
}

/**
 * Computes advanced subject analytics including comparison metrics,
 * monthly trend data, and shortage gap analysis.
 */
export async function computeSubjectAnalytics(studentId, options = {}) {
  const subjectData = await computeStudentSubjectAttendance(studentId, options);
  const subjects = subjectData.subjects;

  const comparison = subjects.map(s => ({
    subjectName: s.subjectName,
    subjectCode: s.subjectCode,
    conductedPercentage: s.conductedPercentage,
    plannedPercentage: s.plannedPercentage,
    plannedConfigured: s.plannedConfigured,
    conductedCount: s.conductedCount,
    attendedCount: s.attendedCount,
    absentCount: s.absentCount,
    plannedCount: s.plannedCount,
    benchmark: 60,
    meetsMinimum: s.meetsMinimum,
    lecturesNeededFor60: s.lecturesNeededFor60
  }));

  const totalAttended = subjectData.summary.totalAttendedLectures;
  const totalAbsent = subjectData.summary.totalAbsentLectures;
  const totalConducted = subjectData.summary.totalConductedLectures;

  const monthlyTrend = [
    {
      month: "Nov 2026",
      monthKey: "2026-11",
      conducted: totalConducted,
      attended: totalAttended,
      absent: totalAbsent,
      percentage: subjectData.summary.overallConductedPercentage
    }
  ];

  const distribution = {
    present: totalAttended,
    absent: totalAbsent,
    total: totalConducted
  };

  const shortageAnalysis = subjects
    .filter(s => !s.meetsMinimum)
    .map(s => ({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      currentPercentage: s.percentage,
      requiredBenchmark: 60,
      deficitPercentage: Number((60 - s.percentage).toFixed(2)),
      attendedCount: s.attendedCount,
      conductedCount: s.conductedCount,
      lecturesNeededFor60: s.lecturesNeededFor60
    }));

  return {
    student: subjectData.student,
    summary: subjectData.summary,
    comparison,
    monthlyTrend,
    distribution,
    shortageAnalysis
  };
}

/**
 * Computes teaching attendance calendar for staff (Teacher, HOD, Coordinator, Principal).
 * Shows scheduled, completed, and pending lectures per day.
 */
export async function computeTeachingMonthlyCalendar(user, yearInput, monthInput, options = {}) {
  const role = options.role || user.role || "teacher";
  const now = new Date();
  const year = parseInt(yearInput, 10) || now.getUTCFullYear();
  const month = parseInt(monthInput, 10) || (now.getUTCMonth() + 1);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

  const branch = options.branch || user.branch || "CSE";
  const semester = options.semester || "5th Semester";

  // Build query according to role
  const query = {
    date: { $gte: startOfMonth, $lte: endOfMonth }
  };

  if (role === "teacher") {
    // Match by facultyId or facultyName
    query.$or = [
      { facultyId: user._id },
      { facultyName: user.fullName || user.name }
    ];
  } else if (role === "hod") {
    query.branch = resolveDepartmentBranch(branch);
  } else if (role === "coordinator") {
    if (options.branch) {
      query.branch = resolveDepartmentBranch(options.branch);
    }
  } else if (role === "principal") {
    if (options.branch && options.branch !== "all") {
      query.branch = resolveDepartmentBranch(options.branch);
    }
  }

  const sessions = await SubjectAttendanceSession.find(query)
    .sort({ date: 1, periodNumber: 1 })
    .lean();

  // If teacher has no assigned sessions by ID/name, fall back to department sessions
  let effectiveSessions = sessions;
  if (role === "teacher" && sessions.length === 0) {
    effectiveSessions = await SubjectAttendanceSession.find({
      branch: resolveDepartmentBranch(branch),
      semester,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1, periodNumber: 1 }).lean();
  }

  // Get config for holidays
  let config = await AcademicAttendanceConfig.findOne({ branch: resolveDepartmentBranch(branch), semester }).lean();
  if (!config) {
    config = await AcademicAttendanceConfig.findOne({}).lean();
  }

  const holidayMap = new Map();
  if (config?.holidays) {
    for (const h of config.holidays) {
      holidayMap.set(formatDateKey(h.date || h), h.title || "Institutional Holiday");
    }
  }

  const sessionsByDate = new Map();
  for (const s of effectiveSessions) {
    const dKey = formatDateKey(s.date);
    if (!sessionsByDate.has(dKey)) {
      sessionsByDate.set(dKey, []);
    }
    sessionsByDate.get(dKey).push(s);
  }

  const today = normalizeDate(new Date());
  const todayKey = formatDateKey(today);

  let totalScheduled = 0;
  let totalCompleted = 0;
  let totalPending = 0;
  let totalCancelled = 0;

  const calendarDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(Date.UTC(year, month - 1, d, 0, 0, 0, 0));
    const dateKey = formatDateKey(dateObj);
    const dayOfWeek = dateObj.getUTCDay();
    const dayName = DAY_NAMES[dayOfWeek];

    const isSunday = dayOfWeek === 0;
    const isHoliday = isSunday || holidayMap.has(dateKey);
    const holidayTitle = isSunday ? "Sunday Non-Working Day" : (holidayMap.get(dateKey) || "College Holiday");
    const isFuture = dateObj > today;
    const isToday = dateKey === todayKey;

    const daySessions = sessionsByDate.get(dateKey) || [];
    const scheduledCount = daySessions.length;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    const lectureList = daySessions.map(s => {
      const isConducted = s.status === "conducted";
      const isCancelled = s.status === "cancelled";
      const hasSubmissions = (s.presentCount + s.absentCount) > 0;
      const isMarked = isConducted && hasSubmissions;

      if (isCancelled) {
        cancelledCount++;
      } else if (isMarked) {
        completedCount++;
      } else if (isConducted && !isFuture) {
        pendingCount++;
      }

      const totalStudents = s.totalEnrolled || 4;
      const attPct = totalStudents > 0 ? Number(((s.presentCount / totalStudents) * 100).toFixed(1)) : 0;

      return {
        sessionId: s._id.toString(),
        subject: s.subject,
        subjectCode: s.subjectCode || "CORE",
        branch: s.branch,
        semester: s.semester,
        section: s.section || "A",
        periodNumber: s.periodNumber,
        startTime: s.startTime || `Period ${s.periodNumber}`,
        endTime: s.endTime || "",
        roomNo: s.roomNo || "Room 302",
        facultyId: s.facultyId ? s.facultyId.toString() : "",
        facultyName: s.facultyName || "Faculty Member",
        sessionType: s.sessionType || "theory",
        topic: s.topic || "Core Curriculum Lecture",
        status: s.status,
        isMarked,
        presentCount: s.presentCount || 0,
        absentCount: s.absentCount || 0,
        totalEnrolled: totalStudents,
        attendancePercentage: attPct,
        submittedAt: s.submittedAt || s.createdAt
      };
    });

    totalScheduled += scheduledCount;
    totalCompleted += completedCount;
    totalPending += pendingCount;
    totalCancelled += cancelledCount;

    calendarDays.push({
      date: dateKey,
      day: d,
      dayOfWeek,
      dayName,
      scheduledCount,
      completedCount,
      pendingCount,
      cancelledCount,
      hasLectures: scheduledCount > 0,
      isHoliday,
      holidayTitle: isHoliday ? holidayTitle : null,
      isFuture,
      isToday,
      lectures: lectureList
    });
  }

  // Subject distribution
  const subjectDistributionMap = new Map();
  for (const s of effectiveSessions) {
    const key = s.subject;
    const curr = subjectDistributionMap.get(key) || { subject: key, count: 0, completed: 0 };
    curr.count++;
    if (s.presentCount + s.absentCount > 0) curr.completed++;
    subjectDistributionMap.set(key, curr);
  }

  const subjectDistribution = Array.from(subjectDistributionMap.values());

  return {
    role,
    branch,
    semester,
    year,
    month,
    monthName: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-IN", { month: "long" }),
    daysInMonth,
    calendarDays,
    summary: {
      totalScheduled,
      totalCompleted,
      totalPending,
      totalCancelled,
      completionRate: totalScheduled > 0 ? Number(((totalCompleted / totalScheduled) * 100).toFixed(1)) : 100
    },
    subjectDistribution
  };
}

/**
 * Computes the individual student attendance roster for a specific lecture session.
 */
export async function computeLectureStudentRoster(sessionId) {
  const session = await SubjectAttendanceSession.findById(sessionId).lean();
  if (!session) throw new Error("Lecture session not found.");

  // Find enrolled students
  const studentProfiles = await StudentProfile.find({
    branch: session.branch,
    semester: session.semester
  }).populate("userId", "fullName name email rollNumber enrollmentNo").lean();

  // Find actual submitted records
  const records = await SubjectAttendanceRecord.find({ sessionId: session._id }).lean();
  const recordMap = new Map();
  records.forEach(r => recordMap.set(r.studentId.toString(), r));

  let presentCount = 0;
  let absentCount = 0;
  let pendingCount = 0;

  const roster = studentProfiles.map(sp => {
    const user = sp.userId;
    const userIdStr = user?._id?.toString() || sp._id.toString();
    const rec = recordMap.get(userIdStr);

    let status = "pending";
    let isMarked = false;
    let remarks = "";
    let markingMethod = "Not Submitted";

    if (rec) {
      status = rec.status;
      isMarked = true;
      remarks = rec.remarks || "";
      markingMethod = rec.remarks?.includes("Manual") ? "Manual Teacher Roll-Call" : "Digital Attendance Studio";

      if (status === "present" || status === "late") presentCount++;
      else if (status === "absent") absentCount++;
    } else {
      pendingCount++;
    }

    return {
      studentId: userIdStr,
      rollNumber: sp.rollNumber || user?.rollNumber || "2024CSE042",
      name: user?.fullName || user?.name || "Student",
      email: user?.email || "",
      status,
      isMarked,
      markingMethod,
      remarks,
      auditHistory: rec?.auditHistory || []
    };
  });

  const totalStudents = roster.length;
  const attendancePercentage = (presentCount + absentCount) > 0
    ? Number(((presentCount / (presentCount + absentCount)) * 100).toFixed(1))
    : 0;

  return {
    session: {
      sessionId: session._id.toString(),
      subject: session.subject,
      subjectCode: session.subjectCode || "CORE",
      branch: session.branch,
      semester: session.semester,
      section: session.section || "A",
      periodNumber: session.periodNumber,
      startTime: session.startTime || `Period ${session.periodNumber}`,
      endTime: session.endTime || "",
      roomNo: session.roomNo || "Room 302",
      facultyName: session.facultyName || "Faculty Member",
      sessionType: session.sessionType || "theory",
      topic: session.topic || "Curriculum Session",
      date: formatDateKey(session.date),
      status: session.status,
      submittedAt: session.submittedAt || session.createdAt
    },
    metrics: {
      totalStudents,
      presentCount,
      absentCount,
      pendingCount,
      attendancePercentage
    },
    students: roster
  };
}
