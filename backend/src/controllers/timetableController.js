/**
 * CollegeOS Timetable Management Controller
 * Handles configuration, subject/faculty mapping, room management,
 * availability, auto-generation, manual editing, conflicts,
 * approval workflows, publishing, versioning, and reports.
 */

import fs from "node:fs";
import Timetable from "../models/Timetable.js";
import TimetableConfig from "../models/TimetableConfig.js";
import TimetableVersion from "../models/TimetableVersion.js";
import FacultyAvailability from "../models/FacultyAvailability.js";
import CampusRoom from "../models/CampusRoom.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { generateAutomaticTimetable } from "../services/timetableGenerator.js";
import { validateTimetableConflicts, isTimeOverlapping } from "../services/timetableConflictService.js";
import { resolveUploadFile } from "../utils/uploadPaths.js";
import { extractTimetableFromImage } from "../services/timetableOcrService.js";

// Semester & session normalizers for rock-solid consistency across payloads
export function normalizeSemester(sem) {
  if (!sem) return "Semester 5";
  const str = String(sem).trim();
  const digitMatch = str.match(/\d+/);
  if (digitMatch) {
    return `Semester ${digitMatch[0]}`;
  }
  return str;
}

export function getSemesterVariants(sem) {
  const norm = normalizeSemester(sem);
  const digit = norm.match(/\d+/)?.[0];
  const set = new Set([norm, String(sem || "").trim()]);
  if (digit) {
    set.add(digit);
    set.add(`Semester ${digit}`);
    set.add(`${digit}th Semester`);
    set.add(`${digit}th Sem`);
    set.add(`Sem ${digit}`);
    set.add(`Semester-${digit}`);
    set.add(`SEM-${digit}`);
    set.add("3RD / 5TH SEM");
    set.add("3rd / 5th Sem");
  }
  return Array.from(set).filter(Boolean);
}

export function normalizeSession(sess) {
  if (!sess) return "2025-2026";
  const str = String(sess).trim();
  if (str === "2025-26") return "2025-2026";
  if (str === "2026-27") return "2026-2027";
  return str;
}

// Helper to keep legacy daily Timetable documents in sync for backwards-compatibility
async function syncLegacyDailyTimetables(masterTimetable) {
  try {
    const { branch, academicYear, semester, scheduleDays } = masterTimetable;
    if (!scheduleDays || scheduleDays.length === 0) return;

    for (const day of scheduleDays) {
      await Timetable.findOneAndUpdate(
        {
          branch,
          semester,
          dayOfWeek: day.dayOfWeek,
          isMaster: false
        },
        {
          branch,
          academicYear,
          semester,
          dayOfWeek: day.dayOfWeek,
          slots: day.slots,
          isMaster: false,
          status: masterTimetable.status
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error("[Timetable] Warning: Failed to sync legacy daily records:", err.message);
  }
}

/**
 * MODULE 1: Timetable Dashboard Statistics
 * GET /api/timetable/dashboard-stats
 */
export async function getTimetableDashboardStats(req, res, next) {
  try {
    let { branch, semester, academicSession } = req.query;
    branch = branch || (req.user.role === "hod" || req.user.role === "teacher" || req.user.role === "coordinator" ? req.user.department || "CSE" : "CSE");
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    // 1. Fetch current published or working timetable
    const currentTimetable = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      isMaster: true
    }).sort({ updatedAt: -1 }).lean();

    // 2. Count total subjects configured & required hours
    const cohortSubjects = await Subject.find({
      branch,
      semester: { $in: [semester, semester.replace("Semester ", "")] },
      status: { $ne: "archived" }
    }).select("hoursPerWeek").lean();
    const totalSubjects = cohortSubjects.length;
    const totalCurriculumHours = cohortSubjects.reduce((acc, s) => acc + (s.hoursPerWeek || 4), 0);

    // 3. Count total assigned faculty in department
    const totalFaculty = await TeacherProfile.countDocuments({
      department: branch
    });

    // 4. Count total campus classrooms & labs
    const totalRooms = await CampusRoom.countDocuments({ isAvailable: true });

    // 5. Total scheduled periods & completion status
    let totalScheduledPeriods = 0;
    let theoryPeriods = 0;
    let practicalPeriods = 0;
    const activeFacultySet = new Set();
    const activeRoomsSet = new Set();

    if (currentTimetable?.scheduleDays) {
      for (const day of currentTimetable.scheduleDays) {
        for (const slot of day.slots || []) {
          if (!slot.isBreak && slot.subject && !slot.subject.toLowerCase().includes("free period")) {
            totalScheduledPeriods++;
            if (slot.type === "Practical") practicalPeriods++;
            else theoryPeriods++;
            if (slot.teacherName) activeFacultySet.add(slot.teacherName);
            if (slot.roomNo) activeRoomsSet.add(slot.roomNo);
          }
        }
      }
    }

    // 6. Pending approval counts
    const pendingApprovalCount = await Timetable.countDocuments({
      isMaster: true,
      status: "under_review"
    });

    // 7. Published timetables count
    const publishedCount = await Timetable.countDocuments({
      isMaster: true,
      status: "published",
      isCurrentPublished: true
    });

    // 8. Recent activities
    const recentActivities = await Timetable.find({ isMaster: true })
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("branch semester section status version updatedAt approvalHistory")
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalScheduledPeriods,
        theoryPeriods,
        practicalPeriods,
        totalSubjects,
        totalFaculty,
        activeFacultyCount: activeFacultySet.size,
        totalRooms,
        activeRoomsCount: activeRoomsSet.size,
        pendingApprovalCount,
        publishedCount,
        currentStatus: currentTimetable?.status || "unconfigured",
        currentVersion: currentTimetable?.version || 1,
        weeklyCompletionRate: totalCurriculumHours > 0 ? Math.min(100, Math.round((totalScheduledPeriods / totalCurriculumHours) * 100)) : 0,
        recentActivities: recentActivities.map((t) => ({
          id: t._id,
          branch: t.branch,
          semester: t.semester,
          section: t.section || "A",
          status: t.status,
          version: t.version,
          updatedAt: t.updatedAt,
          lastAction: t.approvalHistory?.[t.approvalHistory.length - 1] || null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 2: Academic Configuration
 * GET /api/timetable/config
 */
export async function getTimetableConfig(req, res, next) {
  try {
    let { branch, semester, section = "A", academicSession } = req.query;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    let config = await TimetableConfig.findOne({
      academicSession,
      branch,
      semester,
      section
    }).lean();

    const defaultSlots = [
      { slotNumber: 1, label: "I", startTime: "08:00", endTime: "09:00", isBreak: false },
      { slotNumber: 2, label: "II", startTime: "09:00", endTime: "10:00", isBreak: false },
      { slotNumber: 3, label: "III", startTime: "10:00", endTime: "11:00", isBreak: false },
      { slotNumber: 4, label: "IV", startTime: "11:00", endTime: "12:00", isBreak: false },
      { slotNumber: 5, label: "V", startTime: "12:00", endTime: "13:00", isBreak: false },
      { slotNumber: 6, label: "LUNCH", startTime: "13:00", endTime: "14:00", isBreak: true, breakType: "lunch" },
      { slotNumber: 7, label: "VI–VII", startTime: "14:00", endTime: "16:00", isBreak: false }
    ];
    const defaultBreaks = [
      { label: "Lunch Break", startTime: "13:00", endTime: "14:00", afterPeriod: 5, breakType: "lunch" }
    ];

    if (!config) {
      // Default template
      config = {
        academicSession,
        branch,
        semester,
        section,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        collegeStartTime: "08:00",
        collegeEndTime: "16:00",
        periodDuration: 60,
        dailyPeriods: 7,
        slots: defaultSlots,
        breaks: defaultBreaks,
        specialExceptions: []
      };
    } else {
      if (!config.slots || config.slots.length === 0) {
        config.slots = defaultSlots;
      }
      if (!config.breaks || config.breaks.length === 0) {
        config.breaks = defaultBreaks;
      }
    }

    return res.status(200).json({ success: true, config });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/config
 * Save or update configuration
 */
export async function saveTimetableConfig(req, res, next) {
  try {
    let {
      academicSession,
      branch,
      semester,
      section = "A",
      workingDays,
      collegeStartTime,
      collegeEndTime,
      periodDuration,
      dailyPeriods,
      slots,
      breaks,
      specialExceptions
    } = req.body;

    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    if (!branch || !semester) {
      return res.status(400).json({
        success: false,
        message: "Branch and Semester are required."
      });
    }

    // Validate that slots don't overlap with themselves
    for (let i = 0; i < (slots || []).length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isTimeOverlapping(slots[i].startTime, slots[i].endTime, slots[j].startTime, slots[j].endTime)) {
          return res.status(400).json({
            success: false,
            message: `Overlapping slot configuration detected between Slot ${slots[i].slotNumber} (${slots[i].startTime}-${slots[i].endTime}) and Slot ${slots[j].slotNumber} (${slots[j].startTime}-${slots[j].endTime}).`
          });
        }
      }
    }

    const existingConfig = await TimetableConfig.findOne({ academicSession, branch, semester, section }).lean();
    let finalSlots = slots;
    if (!finalSlots || finalSlots.length === 0) {
      finalSlots = (existingConfig?.slots && existingConfig.slots.length > 0) ? existingConfig.slots : [
        { slotNumber: 1, label: "I", startTime: "08:00", endTime: "09:00", isBreak: false },
        { slotNumber: 2, label: "II", startTime: "09:00", endTime: "10:00", isBreak: false },
        { slotNumber: 3, label: "III", startTime: "10:00", endTime: "11:00", isBreak: false },
        { slotNumber: 4, label: "IV", startTime: "11:00", endTime: "12:00", isBreak: false },
        { slotNumber: 5, label: "V", startTime: "12:00", endTime: "13:00", isBreak: false },
        { slotNumber: 6, label: "LUNCH", startTime: "13:00", endTime: "14:00", isBreak: true, breakType: "lunch" },
        { slotNumber: 7, label: "VI–VII", startTime: "14:00", endTime: "16:00", isBreak: false }
      ];
    }
    let finalBreaks = breaks;
    if (!finalBreaks || finalBreaks.length === 0) {
      finalBreaks = (existingConfig?.breaks && existingConfig.breaks.length > 0) ? existingConfig.breaks : [
        { label: "Lunch Break", startTime: "13:00", endTime: "14:00", afterPeriod: 5, breakType: "lunch" }
      ];
    }

    const updated = await TimetableConfig.findOneAndUpdate(
      { academicSession, branch, semester, section },
      {
        academicSession,
        branch,
        semester,
        section,
        workingDays: workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        collegeStartTime: collegeStartTime || "09:00",
        collegeEndTime: collegeEndTime || "17:00",
        periodDuration: periodDuration || 50,
        dailyPeriods: dailyPeriods || 7,
        slots: finalSlots,
        breaks: finalBreaks,
        specialExceptions: specialExceptions || [],
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Academic timetable configuration saved successfully.",
      config: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 3: Subject & Faculty Mapping
 * GET /api/timetable/subjects
 */
export async function getTimetableSubjects(req, res, next) {
  try {
    let { branch = "CSE", semester } = req.query;
    const normSem = normalizeSemester(semester);

    const subjects = await Subject.find({
      branch,
      semester: { $in: [normSem, semester, String(semester).replace("Semester ", "")] },
      status: { $ne: "archived" }
    })
      .populate("assignedTeacherId", "fullName email phone role department")
      .lean();

    // Fetch ALL registered academic staff (Teachers, Coordinators, HODs, Principals, Admins)
    const staffUsers = await User.find({
      role: { $in: ["teacher", "coordinator", "hod", "principal", "admin"] },
      status: "verified"
    })
      .select("fullName email role department")
      .lean();

    const profiles = await TeacherProfile.find({}).lean();
    const profileMap = new Map();
    for (const p of profiles) {
      if (p.userId) profileMap.set(p.userId.toString(), p);
    }

    const availableTeachers = staffUsers.map((u) => {
      const p = profileMap.get(u._id.toString());
      const roleBadge =
        u.role === "hod" ? "HOD" :
        u.role === "principal" ? "Principal" :
        u.role === "coordinator" ? "Coordinator" :
        u.role === "admin" ? "Admin" : "Faculty";
      
      const designation = p?.designation || (
        u.role === "hod" ? "Head of Department & Professor" :
        u.role === "principal" ? "Principal & Senior Professor" :
        u.role === "coordinator" ? "Academic Coordinator & Lecturer" :
        u.role === "admin" ? "Systems Administrator & Faculty" :
        "Assistant Professor / Lecturer"
      );

      return {
        _id: u._id,
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        department: u.department || p?.department || branch,
        designation,
        label: `${u.fullName} (${roleBadge} — ${designation})`
      };
    });

    return res.status(200).json({
      success: true,
      subjects,
      availableTeachers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/timetable/faculty-staff
 * Retrieve all registered academic staff (Teachers, HODs, Coordinators, Principals)
 */
export async function getAcademicStaffList(req, res, next) {
  try {
    const staffUsers = await User.find({
      role: { $in: ["teacher", "coordinator", "hod", "principal", "admin"] },
      status: "verified"
    })
      .select("fullName email role department")
      .lean();

    const profiles = await TeacherProfile.find({}).lean();
    const profileMap = new Map();
    for (const p of profiles) {
      if (p.userId) profileMap.set(p.userId.toString(), p);
    }

    const staff = staffUsers.map((u) => {
      const p = profileMap.get(u._id.toString());
      const roleBadge =
        u.role === "hod" ? "HOD" :
        u.role === "principal" ? "Principal" :
        u.role === "coordinator" ? "Coordinator" :
        u.role === "admin" ? "Admin" : "Faculty";
      
      const designation = p?.designation || (
        u.role === "hod" ? "Head of Department & Professor" :
        u.role === "principal" ? "Principal & Senior Professor" :
        u.role === "coordinator" ? "Academic Coordinator & Lecturer" :
        u.role === "admin" ? "Systems Administrator & Faculty" :
        "Assistant Professor / Lecturer"
      );

      return {
        _id: u._id,
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        department: u.department || p?.department || "CSE",
        designation,
        label: `${u.fullName} (${roleBadge} — ${designation})`
      };
    });

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/subjects
 * Update Subject scheduling requirements & assigned faculty
 */
export async function updateTimetableSubject(req, res, next) {
  try {
    const {
      subjectId,
      assignedTeacherId,
      hoursPerWeek,
      type,
      preferredRoomType,
      requiredConsecutivePeriods
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({ success: false, message: "subjectId is required." });
    }

    let teacherName = "";
    if (assignedTeacherId) {
      const teacher = await User.findById(assignedTeacherId).select("fullName").lean();
      teacherName = teacher?.fullName || "";
    }

    const updated = await Subject.findByIdAndUpdate(
      subjectId,
      {
        ...(assignedTeacherId !== undefined && { assignedTeacherId: assignedTeacherId || null }),
        ...(teacherName && { assignedTeacherName: teacherName }),
        ...(hoursPerWeek !== undefined && { hoursPerWeek }),
        ...(type !== undefined && { type }),
        ...(preferredRoomType !== undefined && { preferredRoomType }),
        ...(requiredConsecutivePeriods !== undefined && { requiredConsecutivePeriods })
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Subject scheduling requirements updated.",
      subject: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 4: Rooms and Labs
 * GET /api/timetable/rooms
 */
export async function getTimetableRooms(req, res, next) {
  try {
    const rooms = await CampusRoom.find({}).sort({ roomNumber: 1 }).lean();
    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/rooms
 */
export async function saveTimetableRoom(req, res, next) {
  try {
    const { roomNumber, building, floor, type, capacity, isAvailable, branch, unavailableSlots } = req.body;

    if (!roomNumber) {
      return res.status(400).json({ success: false, message: "Room number is required." });
    }

    const updated = await CampusRoom.findOneAndUpdate(
      { roomNumber: roomNumber.trim() },
      {
        roomNumber: roomNumber.trim(),
        building: building || "Academic Block A",
        floor: floor || "1st Floor",
        type: type || "Classroom",
        capacity: capacity || 60,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        branch: branch || "ALL",
        unavailableSlots: unavailableSlots || []
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Room record updated successfully.",
      room: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 5: Faculty Availability
 * GET /api/timetable/availability
 */
export async function getFacultyAvailability(req, res, next) {
  try {
    let { department = "CSE" } = req.query;

    const list = await FacultyAvailability.find({ department }).lean();

    // Also get all department teachers
    const teachers = await User.find({
      role: { $in: ["teacher", "hod", "coordinator"] },
      status: "verified"
    })
      .select("fullName email department")
      .lean();

    return res.status(200).json({
      success: true,
      availabilityList: list,
      teachers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/availability
 */
export async function saveFacultyAvailability(req, res, next) {
  try {
    const { teacherId, maxWeeklyLoad, availableDays, unavailableSlots, preferredSlots, notes } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: "teacherId is required." });
    }

    const teacher = await User.findById(teacherId).select("fullName department").lean();
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Faculty member not found." });
    }

    const updated = await FacultyAvailability.findOneAndUpdate(
      { teacherId },
      {
        teacherId,
        teacherName: teacher.fullName,
        department: teacher.department || "CSE",
        maxWeeklyLoad: maxWeeklyLoad || 20,
        availableDays: availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        unavailableSlots: unavailableSlots || [],
        preferredSlots: preferredSlots || [],
        notes: notes || ""
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Faculty availability settings updated.",
      availability: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 6: Automatic Timetable Generator
 * POST /api/timetable/generate
 */
export async function generateTimetable(req, res, next) {
  try {
    let { branch, semester, section = "A", academicSession } = req.body;

    if (!branch || !semester) {
      return res.status(400).json({
        success: false,
        message: "Branch and Semester are required for automatic generation."
      });
    }

    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    const result = await generateAutomaticTimetable({
      branch,
      semester,
      section,
      academicSession
    });

    // Save as draft working timetable in database
    const existing = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      section,
      isMaster: true
    });

    let savedDoc;
    if (existing) {
      existing.scheduleDays = result.scheduleDays;
      existing.status = "generated";
      existing.metrics = {
        totalPeriods: result.summary.totalPeriods,
        theoryPeriods: result.summary.theoryPeriods,
        practicalPeriods: result.summary.practicalPeriods,
        facultyCount: result.summary.facultyCount,
        roomCount: result.summary.roomCount,
        weeklyCompletionRate: 100
      };
      existing.approvalHistory.push({
        user: req.user.fullName,
        userId: req.user._id,
        role: req.user.role,
        action: "generated",
        timestamp: new Date(),
        remarks: `Automatically generated schedule with score ${result.summary.bestScore}`
      });
      savedDoc = await existing.save();
    } else {
      savedDoc = await Timetable.create({
        academicSession,
        branch,
        academicYear: "3rd Year",
        semester,
        section,
        status: "generated",
        version: 1,
        isMaster: true,
        scheduleDays: result.scheduleDays,
        approvalHistory: [
          {
            user: req.user.fullName,
            userId: req.user._id,
            role: req.user.role,
            action: "generated",
            timestamp: new Date(),
            remarks: `Automatically generated schedule with score ${result.summary.bestScore}`
          }
        ],
        metrics: {
          totalPeriods: result.summary.totalPeriods,
          theoryPeriods: result.summary.theoryPeriods,
          practicalPeriods: result.summary.practicalPeriods,
          facultyCount: result.summary.facultyCount,
          roomCount: result.summary.roomCount,
          weeklyCompletionRate: 100
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Automatic timetable generated successfully (${result.summary.totalPeriods} periods allocated).`,
      timetable: savedDoc,
      summary: result.summary
    });
  } catch (error) {
    return res.status(422).json({
      success: false,
      message: error.message || "Failed to generate automatic timetable."
    });
  }
}

/**
 * MODULE 7 & 8: Manual Timetable Editor & Conflict Detection
 * GET /api/timetable/manage
 */
export async function getManageTimetable(req, res, next) {
  try {
    let { branch = "CSE", semester, section = "A", academicSession } = req.query;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    let timetable = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      section,
      isMaster: true
    }).lean();

    if (!timetable) {
      // Check if legacy daily records exist
      const legacyDocs = await Timetable.find({ branch, semester, isMaster: { $ne: true } }).lean();
      if (legacyDocs.length > 0) {
        const scheduleDays = legacyDocs.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          slots: d.slots
        }));
        timetable = {
          branch,
          semester,
          section,
          academicSession,
          status: "draft",
          version: 1,
          scheduleDays
        };
      }
    }

    return res.status(200).json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/manage
 * Save manual changes to timetable
 */
export async function saveManualTimetable(req, res, next) {
  try {
    let {
      branch,
      semester,
      section = "A",
      academicSession,
      scheduleDays,
      status = "draft",
      creationMode = "manual",
      title = "Department Timetable",
      collegeName = "Swami Vivekanand Subharti University",
      effectiveDate,
      imageUrl = ""
    } = req.body;

    if (!branch || !semester || !scheduleDays) {
      return res.status(400).json({
        success: false,
        message: "Branch, semester, and scheduleDays are required."
      });
    }

    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    // 1. Fetch config for break checking
    const config = await TimetableConfig.findOne({ branch, semester, section, academicSession }).lean();

    let existing = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      section,
      isMaster: true
    });

    // 2. Run real-time hard constraint conflict check
    const conflictResult = await validateTimetableConflicts({
      scheduleDays,
      branch,
      semester,
      section,
      academicSession,
      breaks: config?.breaks || [],
      excludeTimetableId: existing?._id
    });

    if (!conflictResult.isValid) {
      return res.status(409).json({
        success: false,
        message: "Cannot save timetable with blocking conflicts. Please resolve the errors below.",
        blockingErrors: conflictResult.blockingErrors,
        warnings: conflictResult.warnings
      });
    }

    const parsedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();

    if (existing) {
      existing.timetableType = "structured";
      if (creationMode) existing.creationMode = creationMode;
      if (title) existing.title = title;
      if (collegeName) existing.collegeName = collegeName;
      if (effectiveDate) existing.effectiveDate = parsedEffectiveDate;
      if (imageUrl) existing.imageUrl = imageUrl;
      existing.scheduleDays = scheduleDays;
      if (status) existing.status = status;
      existing.approvalHistory.push({
        user: req.user.fullName,
        userId: req.user._id,
        role: req.user.role,
        action: "edited",
        timestamp: new Date(),
        remarks: "Manual adjustments saved"
      });
      await existing.save();
    } else {
      existing = await Timetable.create({
        academicSession,
        branch,
        academicYear: "3rd Year",
        semester,
        section,
        status,
        version: 1,
        isMaster: true,
        timetableType: "structured",
        creationMode: creationMode || "manual",
        title: title || "Department Timetable",
        collegeName: collegeName || "Swami Vivekanand Subharti University",
        effectiveDate: parsedEffectiveDate,
        imageUrl: imageUrl || "",
        scheduleDays,
        approvalHistory: [
          {
            user: req.user.fullName,
            userId: req.user._id,
            role: req.user.role,
            action: "created",
            timestamp: new Date(),
            remarks: "Manual timetable initialized"
          }
        ]
      });
    }

    return res.status(200).json({
      success: true,
      message: "Timetable saved successfully.",
      timetable: existing,
      warnings: conflictResult.warnings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE: Photo Upload & OCR Import
 * POST /api/timetable/upload-photo
 */
export async function uploadTimetablePhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No timetable photograph file uploaded." });
    }
    const publicUrl = `/uploads/timetables/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: "Timetable photograph uploaded successfully.",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        url: publicUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/extract-photo
 * Run OCR extraction on uploaded photograph and match to academic records
 */
export async function extractTimetablePhoto(req, res, next) {
  try {
    let { imageUrl, imagePath, branch = "CSE", semester = "Semester 5" } = req.body;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);

    let resolvedPath = imagePath;
    if (!resolvedPath && imageUrl) {
      resolvedPath = resolveUploadFile(imageUrl, "timetables");
      if (!resolvedPath || !fs.existsSync(resolvedPath)) {
        resolvedPath = resolveUploadFile(imageUrl);
      }
    }

    const extraction = await extractTimetableFromImage(resolvedPath || imageUrl, branch, semester);

    return res.status(200).json({
      success: true,
      extraction
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE: Direct Photo Timetable Publishing
 * POST /api/timetable/save-photo-timetable
 */
export async function savePhotoTimetable(req, res, next) {
  try {
    let {
      academicSession = "2025-2026",
      branch = "CSE",
      semester = "Semester 5",
      section = "A",
      title = "Department Timetable",
      collegeName = "Swami Vivekanand Subharti University",
      effectiveDate,
      imageUrl,
      imageOriginalName,
      imageMimeType,
      imageSizeBytes,
      notes = "",
      status = "draft"
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "imageUrl is required for direct photo timetable." });
    }

    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    let existing = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      section,
      isMaster: true
    });

    const parsedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();

    if (existing) {
      existing.timetableType = "image_based";
      existing.creationMode = "photo_direct";
      existing.imageUrl = imageUrl;
      existing.imageOriginalName = imageOriginalName || existing.imageOriginalName || "timetable.jpg";
      existing.imageMimeType = imageMimeType || existing.imageMimeType || "image/jpeg";
      existing.imageSizeBytes = imageSizeBytes || existing.imageSizeBytes || 0;
      existing.title = title;
      existing.collegeName = collegeName;
      existing.effectiveDate = parsedEffectiveDate;
      existing.scheduleDays = []; // image-based timetable stores original photo
      if (status) existing.status = status;

      existing.approvalHistory.push({
        user: req.user.fullName,
        userId: req.user._id,
        role: req.user.role,
        action: status === "under_review" ? "submitted_for_approval" : "edited",
        timestamp: new Date(),
        remarks: notes || "Direct photograph timetable updated"
      });

      await existing.save();
    } else {
      existing = await Timetable.create({
        academicSession,
        branch,
        academicYear: "3rd Year",
        semester,
        section,
        timetableType: "image_based",
        creationMode: "photo_direct",
        imageUrl,
        imageOriginalName: imageOriginalName || "timetable.jpg",
        imageMimeType: imageMimeType || "image/jpeg",
        imageSizeBytes: imageSizeBytes || 0,
        title,
        collegeName,
        effectiveDate: parsedEffectiveDate,
        status: status || "draft",
        version: 1,
        isMaster: true,
        scheduleDays: [],
        approvalHistory: [
          {
            user: req.user.fullName,
            userId: req.user._id,
            role: req.user.role,
            action: "created",
            timestamp: new Date(),
            remarks: notes || "Direct photograph timetable created"
          }
        ]
      });
    }

    return res.status(200).json({
      success: true,
      message: "Direct photograph timetable saved successfully.",
      timetable: existing
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/check-conflicts
 */
export async function checkTimetableConflicts(req, res, next) {
  try {
    let { branch, semester, section = "A", academicSession, scheduleDays } = req.body;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    const config = await TimetableConfig.findOne({ branch, semester, section, academicSession }).lean();
    const existing = await Timetable.findOne({ branch, semester, section, academicSession, isMaster: true }).select("_id").lean();

    const result = await validateTimetableConflicts({
      scheduleDays,
      branch,
      semester,
      section,
      academicSession,
      breaks: config?.breaks || [],
      excludeTimetableId: existing?._id
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 9: Approval & Publication Workflow
 * POST /api/timetable/workflow
 */
export async function handleTimetableWorkflow(req, res, next) {
  try {
    let { timetableId, branch, semester, section = "A", academicSession, action, remarks = "" } = req.body;
    const user = req.user;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "action is required."
      });
    }

    let timetable;
    if (timetableId) {
      timetable = await Timetable.findById(timetableId);
    } else if (branch && semester) {
      timetable = await Timetable.findOne({
        academicSession: normalizeSession(academicSession),
        branch: branch || "CSE",
        semester: normalizeSemester(semester),
        section: section || "A",
        isMaster: true
      });
    }

    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found." });
    }

    // Role-based state transitions
    if (action === "submit_for_approval") {
      // Coordinator or Teacher submits to HOD
      if (!["coordinator", "teacher", "hod", "principal", "admin"].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Unauthorized to submit timetable." });
      }
      timetable.status = "under_review";
      timetable.submittedBy = user._id;
      timetable.submittedAt = new Date();
      timetable.approvalHistory.push({
        user: user.fullName,
        userId: user._id,
        role: user.role,
        action: "submitted_for_approval",
        timestamp: new Date(),
        remarks: remarks || "Submitted for HOD review and approval."
      });
    } else if (action === "approve") {
      // HOD, Principal, or Admin approves
      if (!["hod", "principal", "admin"].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Only HOD or Principal can approve timetables." });
      }
      timetable.status = "approved";
      timetable.approvedBy = user._id;
      timetable.approvedAt = new Date();
      timetable.approvalHistory.push({
        user: user.fullName,
        userId: user._id,
        role: user.role,
        action: "approved",
        timestamp: new Date(),
        remarks: remarks || "Approved by Head of Department."
      });
    } else if (action === "reject" || action === "changes_requested") {
      if (!["hod", "principal", "admin"].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Unauthorized to request changes." });
      }
      timetable.status = "changes_requested";
      timetable.rejectionReason = remarks;
      timetable.approvalHistory.push({
        user: user.fullName,
        userId: user._id,
        role: user.role,
        action: "changes_requested",
        timestamp: new Date(),
        remarks: remarks || "Changes requested. Returned to Coordinator."
      });
    } else {
      return res.status(400).json({ success: false, message: `Unknown workflow action: ${action}` });
    }

    await timetable.save();

    return res.status(200).json({
      success: true,
      message: `Timetable workflow action "${action}" completed. Status is now "${timetable.status}".`,
      timetable
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 10 & 11: Publish Timetable & Version Snapshot
 * POST /api/timetable/publish
 */
export async function publishTimetable(req, res, next) {
  try {
    let { timetableId, branch, semester, section = "A", academicSession, changeNotes = "Official Publication" } = req.body;
    const user = req.user;

    // Check authority: Only HOD, Principal, or Admin can publish official timetables
    if (!["hod", "principal", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only Head of Department (HOD) or Principal can publish the official timetable." });
    }

    let timetable;
    if (timetableId) {
      timetable = await Timetable.findById(timetableId);
    } else if (branch && semester) {
      timetable = await Timetable.findOne({
        academicSession: normalizeSession(academicSession),
        branch: branch || "CSE",
        semester: normalizeSemester(semester),
        section: section || "A",
        isMaster: true
      });
    }

    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found." });
    }

    // 1. Validate hard conflicts before publishing (only for structured timetables)
    if (timetable.timetableType !== "image_based") {
      const config = await TimetableConfig.findOne({
        branch: timetable.branch,
        semester: timetable.semester,
        section: timetable.section || "A"
      }).lean();

      const conflictResult = await validateTimetableConflicts({
        scheduleDays: timetable.scheduleDays || [],
        branch: timetable.branch,
        semester: timetable.semester,
        section: timetable.section || "A",
        academicSession: timetable.academicSession,
        breaks: config?.breaks || [],
        excludeTimetableId: timetable._id
      });

      if (!conflictResult.isValid) {
        return res.status(409).json({
          success: false,
          message: "Cannot publish: Blocking conflicts detected in schedule.",
          blockingErrors: conflictResult.blockingErrors
        });
      }
    }

    // 2. Calculate summary counts
    let totalPeriods = 0;
    let theoryPeriods = 0;
    let practicalPeriods = 0;
    const facultySet = new Set();
    const roomSet = new Set();

    for (const d of timetable.scheduleDays || []) {
      for (const s of d.slots || []) {
        if (!s.isBreak && s.subject && !s.subject.toLowerCase().includes("free period")) {
          totalPeriods++;
          if (s.type === "Practical") practicalPeriods++;
          else theoryPeriods++;
          if (s.teacherName) facultySet.add(s.teacherName);
          if (s.roomNo) roomSet.add(s.roomNo);
        }
      }
    }

    // 3. Increment version and archive snapshot in TimetableVersion
    const nextVersion = (timetable.version || 0) + 1;

    // Set any previous published version of this cohort to superseded
    await TimetableVersion.updateMany(
      {
        branch: timetable.branch,
        semester: timetable.semester,
        section: timetable.section || "A",
        status: "published"
      },
      { status: "superseded" }
    );

    // Save version snapshot
    await TimetableVersion.create({
      originalTimetableId: timetable._id,
      academicSession: timetable.academicSession,
      branch: timetable.branch,
      academicYear: timetable.academicYear || "3rd Year",
      semester: timetable.semester,
      section: timetable.section || "A",
      timetableType: timetable.timetableType || "structured",
      creationMode: timetable.creationMode || "manual",
      imageUrl: timetable.imageUrl || "",
      effectiveDate: timetable.effectiveDate,
      title: timetable.title,
      collegeName: timetable.collegeName,
      version: nextVersion,
      status: "published",
      snapshotDays: timetable.scheduleDays || [],
      summary: {
        totalPeriods,
        theoryPeriods,
        practicalPeriods,
        facultyCount: facultySet.size,
        roomCount: roomSet.size
      },
      publishedAt: new Date(),
      publishedBy: user._id,
      publishedByName: user.fullName,
      changeNotes,
      auditLog: [
        {
          user: user.fullName,
          role: user.role,
          action: "published",
          timestamp: new Date(),
          remarks: changeNotes
        }
      ]
    });

    // 4. Update the master timetable to Published & Current
    timetable.status = "published";
    timetable.version = nextVersion;
    timetable.isCurrentPublished = true;
    timetable.publishedBy = user._id;
    timetable.publishedAt = new Date();
    timetable.approvalHistory.push({
      user: user.fullName,
      userId: user._id,
      role: user.role,
      action: "published",
      timestamp: new Date(),
      remarks: changeNotes
    });
    timetable.metrics = {
      totalPeriods,
      theoryPeriods,
      practicalPeriods,
      facultyCount: facultySet.size,
      roomCount: roomSet.size,
      weeklyCompletionRate: 100
    };

    await timetable.save();

    // 5. Keep legacy daily records synchronized for any older consumers
    await syncLegacyDailyTimetables(timetable);

    // 6. In-app notifications to Students and Teachers
    try {
      const studentUsers = await User.find({ role: "student" }).select("_id").lean();
      for (const st of studentUsers.slice(0, 50)) {
        await Notification.create({
          userId: st._id,
          title: "New Academic Timetable Published",
          message: `Official timetable v${nextVersion} for ${timetable.branch} ${timetable.semester} has been published by ${user.fullName}.`,
          type: "academic",
          link: "#/dashboard/timetable"
        });
      }
    } catch {
      // non-fatal notification error
    }

    return res.status(200).json({
      success: true,
      message: `Timetable v${nextVersion} has been successfully published to Student & Teacher portals.`,
      timetable
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 10: Published Timetables for Student & Public View
 * GET /api/timetable/published
 */
export async function getPublishedTimetable(req, res, next) {
  try {
    let { branch, semester, section = "A", academicSession } = req.query;

    if (!branch || !semester) {
      if (req.user?.role === "student") {
        const prof = await StudentProfile.findOne({ userId: req.user._id }).lean();
        branch = branch || prof?.branch || "CSE";
        semester = semester || prof?.semester || "Semester 5";
      } else {
        branch = branch || "CSE";
        semester = semester || "Semester 5";
      }
    }

    branch = branch || "CSE";
    const semVariants = getSemesterVariants(semester);
    const normSem = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    let published = await Timetable.findOne({
      branch,
      semester: { $in: semVariants },
      section: section || "A",
      isMaster: true,
      status: "published"
    }).sort({ version: -1, updatedAt: -1 }).lean();

    if (!published) {
      published = await Timetable.findOne({
        branch,
        semester: { $in: semVariants },
        isMaster: true,
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    if (!published) {
      published = await Timetable.findOne({
        branch,
        semester: { $in: semVariants },
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    if (!published) {
      published = await Timetable.findOne({
        branch,
        isMaster: true,
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    return res.status(200).json({
      success: true,
      branch,
      semester,
      section,
      timetable: published || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 10: Teacher Personal Teaching Schedule
 * GET /api/timetable/teacher-schedule
 */
export async function getTeacherPersonalSchedule(req, res, next) {
  try {
    const user = req.user;
    const teacherIdStr = user._id.toString();
    const teacherNameNorm = user.fullName.toLowerCase().trim();

    // Find ALL published timetables in the college
    const publishedTimetables = await Timetable.find({
      isMaster: true,
      status: "published"
    }).lean();

    const daysMap = new Map();
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const d of DAYS) {
      daysMap.set(d, []);
    }

    let totalClasses = 0;
    const branchesTaught = new Set();

    for (const tt of publishedTimetables) {
      for (const d of tt.scheduleDays || []) {
        for (const slot of d.slots || []) {
          if (slot.isBreak) continue;

          const isAssignedToTeacher =
            (slot.teacherId && slot.teacherId.toString() === teacherIdStr) ||
            (slot.teacherName && slot.teacherName.toLowerCase().trim() === teacherNameNorm);

          if (isAssignedToTeacher) {
            totalClasses++;
            branchesTaught.add(`${tt.branch} ${tt.semester}`);
            const list = daysMap.get(d.dayOfWeek) || [];
            list.push({
              periodNumber: slot.periodNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject,
              subjectCode: slot.subjectCode,
              branch: tt.branch,
              semester: tt.semester,
              section: tt.section || "A",
              roomNo: slot.roomNo,
              type: slot.type,
              color: slot.color
            });
            daysMap.set(d.dayOfWeek, list);
          }
        }
      }
    }

    // Sort slots by time
    const scheduleDays = [];
    for (const day of DAYS) {
      const slots = daysMap.get(day) || [];
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      scheduleDays.push({
        dayOfWeek: day,
        slots
      });
    }

    return res.status(200).json({
      success: true,
      teacher: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        department: user.department
      },
      stats: {
        totalWeeklyClasses: totalClasses,
        cohortsCount: branchesTaught.size,
        cohorts: Array.from(branchesTaught)
      },
      scheduleDays
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 10: Student Live Schedule with Today's Current/Upcoming Period
 * GET /api/timetable/student-schedule
 */
export async function getStudentClassSchedule(req, res, next) {
  try {
    const user = req.user;
    let branch = "CSE";
    let semester = "Semester 5";
    let section = "A";

    if (user.role === "student") {
      const prof = await StudentProfile.findOne({ userId: user._id }).lean();
      branch = prof?.branch || branch;
      semester = prof?.semester || semester;
      section = prof?.section || section;
    }

    const semVariants = getSemesterVariants(semester);

    // 1. First priority: master published timetable matching branch, semester, section
    let published = await Timetable.findOne({
      branch,
      semester: { $in: semVariants },
      section: section || "A",
      isMaster: true,
      status: "published"
    }).sort({ version: -1, updatedAt: -1 }).lean();

    // 2. Second priority: master published timetable without section constraint
    if (!published) {
      published = await Timetable.findOne({
        branch,
        semester: { $in: semVariants },
        isMaster: true,
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    // 3. Third priority: any published timetable matching branch & semester
    if (!published) {
      published = await Timetable.findOne({
        branch,
        semester: { $in: semVariants },
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    // 4. Fallback: master published timetable for this branch
    if (!published) {
      published = await Timetable.findOne({
        branch,
        isMaster: true,
        status: "published"
      }).sort({ version: -1, updatedAt: -1 }).lean();
    }

    // Determine today's day
    const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todaySchedule = published?.scheduleDays?.find((d) => d.dayOfWeek === todayName);

    // Current time in HH:MM
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, "0");
    const currentM = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentH}:${currentM}`;

    let currentPeriod = null;
    let nextPeriod = null;

    if (todaySchedule?.slots) {
      for (const slot of todaySchedule.slots) {
        if (slot.isBreak) continue;
        if (currentTimeStr >= slot.startTime && currentTimeStr <= slot.endTime) {
          currentPeriod = slot;
        } else if (currentTimeStr < slot.startTime && !nextPeriod) {
          nextPeriod = slot;
        }
      }
    }

    return res.status(200).json({
      success: true,
      branch,
      semester,
      section,
      today: todayName,
      currentTime: currentTimeStr,
      currentPeriod,
      nextPeriod,
      timetable: published || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 11: Timetable Version History & Restore
 * GET /api/timetable/versions
 */
export async function getTimetableVersions(req, res, next) {
  try {
    let { branch = "CSE", semester, section = "A" } = req.query;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);

    const versions = await TimetableVersion.find({
      branch,
      semester: { $in: [semester, semester.replace("Semester ", "")] },
      section
    })
      .sort({ version: -1 })
      .lean();

    return res.status(200).json({ success: true, versions });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/timetable/versions/restore
 */
export async function restoreTimetableVersion(req, res, next) {
  try {
    const { versionId } = req.body;
    const user = req.user;

    if (!["coordinator", "hod", "principal", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Unauthorized to restore timetable versions." });
    }

    const versionDoc = await TimetableVersion.findById(versionId);
    if (!versionDoc) {
      return res.status(404).json({ success: false, message: "Version record not found." });
    }

    const timetable = await Timetable.findById(versionDoc.originalTimetableId);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Original master timetable not found." });
    }

    // Restore scheduleDays and photo metadata from snapshot
    timetable.timetableType = versionDoc.timetableType || "structured";
    timetable.creationMode = versionDoc.creationMode || "manual";
    timetable.imageUrl = versionDoc.imageUrl || "";
    timetable.effectiveDate = versionDoc.effectiveDate || timetable.effectiveDate;
    timetable.title = versionDoc.title || timetable.title;
    timetable.collegeName = versionDoc.collegeName || timetable.collegeName;
    timetable.scheduleDays = versionDoc.snapshotDays || [];
    timetable.status = "published";
    timetable.approvalHistory.push({
      user: user.fullName,
      userId: user._id,
      role: user.role,
      action: "restored",
      timestamp: new Date(),
      remarks: `Restored from version ${versionDoc.version} published on ${new Date(versionDoc.publishedAt).toLocaleDateString()}`
    });

    await timetable.save();
    await syncLegacyDailyTimetables(timetable);

    return res.status(200).json({
      success: true,
      message: `Timetable successfully restored from Version ${versionDoc.version}.`,
      timetable
    });
  } catch (error) {
    next(error);
  }
}

/**
 * MODULE 15: Reports & Utilization
 * GET /api/timetable/reports
 */
export async function getTimetableReports(req, res, next) {
  try {
    let { branch = "CSE", semester, section = "A", academicSession } = req.query;
    branch = branch || "CSE";
    semester = normalizeSemester(semester);
    academicSession = normalizeSession(academicSession);

    const timetable = await Timetable.findOne({
      academicSession,
      branch,
      semester,
      section,
      isMaster: true
    }).lean();

    // 1. Faculty Workload breakdown
    const facultyWorkloadMap = new Map();
    // 2. Room Utilization breakdown
    const roomUsageMap = new Map();

    const allPublished = await Timetable.find({
      academicSession,
      isMaster: true,
      status: "published"
    }).lean();

    for (const tt of allPublished) {
      for (const d of tt.scheduleDays || []) {
        for (const s of d.slots || []) {
          if (!s.isBreak && s.subject && !s.subject.toLowerCase().includes("free period")) {
            // Teacher load
            const tKey = s.teacherName || "Unassigned";
            facultyWorkloadMap.set(tKey, (facultyWorkloadMap.get(tKey) || 0) + 1);

            // Room load
            const rKey = s.roomNo || "Room 101";
            roomUsageMap.set(rKey, (roomUsageMap.get(rKey) || 0) + 1);
          }
        }
      }
    }

    const facultyWorkload = Array.from(facultyWorkloadMap.entries()).map(([teacherName, periods]) => ({
      teacherName,
      periods,
      maxAllowed: 22,
      utilizationPercentage: Math.min(100, Math.round((periods / 22) * 100))
    }));

    const roomUtilization = Array.from(roomUsageMap.entries()).map(([roomNo, periods]) => ({
      roomNo,
      periodsBooked: periods,
      maxSlots: 42, // 6 days * 7 periods
      utilizationPercentage: Math.min(100, Math.round((periods / 42) * 100))
    }));

    return res.status(200).json({
      success: true,
      branch,
      semester,
      timetable,
      facultyWorkload,
      roomUtilization
    });
  } catch (error) {
    next(error);
  }
}
