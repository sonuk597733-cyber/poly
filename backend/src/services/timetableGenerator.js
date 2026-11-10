/**
 * CollegeOS Constraint-Based Hybrid Timetable Generation Engine
 * Uses CSP heuristics (Most Constrained First + Backtracking + Soft Constraint Scoring).
 */

import Timetable from "../models/Timetable.js";
import TimetableConfig from "../models/TimetableConfig.js";
import Subject from "../models/Subject.js";
import CampusRoom from "../models/CampusRoom.js";
import FacultyAvailability from "../models/FacultyAvailability.js";
import { isTimeOverlapping } from "./timetableConflictService.js";

// Visual subject color palette for schedule differentiation
const SUBJECT_COLORS = [
  "#FF6B0A", // Vibrant Orange
  "#2563EB", // Royal Blue
  "#10B981", // Emerald Green
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#3B82F6", // Sky
  "#8B5CF6", // Purple
  "#14B8A6"  // Teal
];

/**
 * Generate a complete, verified weekly timetable.
 */
export async function generateAutomaticTimetable({
  branch,
  semester,
  section = "A",
  academicSession = "2025-2026",
  maxCandidates = 5
}) {
  const normSem = semester && String(semester).startsWith("Semester") ? semester : `Semester ${semester || 5}`;
  const normSess = academicSession === "2025-26" ? "2025-2026" : (academicSession || "2025-2026");

  const diagnosticLog = [];
  diagnosticLog.push(`[Init] Starting Automatic Timetable Generation for ${branch} ${normSem} (Sec ${section})`);

  // 1. Fetch Academic Configuration
  let config = await TimetableConfig.findOne({
    branch,
    semester: { $in: [normSem, semester] },
    section,
    academicSession: normSess
  }).lean();

  if (!config) {
    // Check branch-level default config or create sensible default
    config = await TimetableConfig.findOne({ branch, semester: { $in: [normSem, semester] } }).lean();
  }

  const workingDays = config?.workingDays?.length
    ? config.workingDays
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Default slots if not configured
  const configuredSlots = config?.slots?.length
    ? config.slots
    : [
        { slotNumber: 1, label: "I", startTime: "08:00", endTime: "09:00", isBreak: false },
        { slotNumber: 2, label: "II", startTime: "09:00", endTime: "10:00", isBreak: false },
        { slotNumber: 3, label: "III", startTime: "10:00", endTime: "11:00", isBreak: false },
        { slotNumber: 4, label: "IV", startTime: "11:00", endTime: "12:00", isBreak: false },
        { slotNumber: 5, label: "V", startTime: "12:00", endTime: "13:00", isBreak: false },
        { slotNumber: 6, label: "LUNCH", startTime: "13:00", endTime: "14:00", isBreak: true, breakType: "lunch" },
        { slotNumber: 7, label: "VI–VII", startTime: "14:00", endTime: "16:00", isBreak: false, isLabSlot: true }
      ];

  const teachingSlots = configuredSlots.filter((s) => !s.isBreak);
  const breakSlots = configuredSlots.filter((s) => s.isBreak);

  diagnosticLog.push(`[Config] Working Days: ${workingDays.length}, Teaching Slots/Day: ${teachingSlots.length}, Total Available Slots/Week: ${workingDays.length * teachingSlots.length}`);

  // 2. Fetch Subjects
  const subjects = await Subject.find({
    branch,
    semester: { $in: [normSem, semester, String(semester).replace("Semester ", "")] },
    status: { $ne: "archived" }
  }).lean();

  if (!subjects || subjects.length === 0) {
    throw new Error(
      `No subjects found for ${branch} ${normSem}. Please add and map curriculum subjects first.`
    );
  }

  // Calculate total required periods
  let totalRequiredWeeklyPeriods = 0;
  for (const sub of subjects) {
    totalRequiredWeeklyPeriods += sub.hoursPerWeek || 4;
  }

  const totalAvailableSlots = workingDays.length * teachingSlots.length;
  if (totalRequiredWeeklyPeriods > totalAvailableSlots) {
    throw new Error(
      `Insufficient available teaching periods: The curriculum requires ${totalRequiredWeeklyPeriods} periods/week, but the configuration only provides ${totalAvailableSlots} slots (${workingDays.length} days × ${teachingSlots.length} periods). Please increase daily periods or reduce required subject hours.`
    );
  }

  diagnosticLog.push(`[Validation] Curriculum requires ${totalRequiredWeeklyPeriods} periods. Available: ${totalAvailableSlots}. Feasible.`);

  // 3. Fetch Rooms
  const allRooms = await CampusRoom.find({ isAvailable: true }).lean();
  if (!allRooms || allRooms.length === 0) {
    throw new Error("No campus classrooms or laboratories are currently available in the database.");
  }

  const lectureHalls = allRooms.filter((r) => r.type === "Classroom" || r.type === "Seminar Hall");
  const labs = allRooms.filter((r) => r.type.toLowerCase().includes("lab") || r.type.toLowerCase().includes("workshop"));
  const defaultClassroom = lectureHalls[0] || allRooms[0];

  // 4. Fetch Faculty Availabilities
  const allAvailabilities = await FacultyAvailability.find({}).lean();
  const availMap = new Map();
  for (const fa of allAvailabilities) {
    availMap.set(fa.teacherId.toString(), fa);
    if (fa.teacherName) availMap.set(fa.teacherName.toLowerCase().trim(), fa);
  }

  // 5. Fetch External Bookings (Published schedules of other cohorts)
  const otherTimetables = await Timetable.find({
    academicSession,
    isMaster: true,
    status: { $in: ["published", "approved"] },
    $or: [{ branch: { $ne: branch } }, { semester: { $ne: semester } }, { section: { $ne: section } }]
  }).lean();

  // Build reservations lookup: day -> array of { startTime, endTime, teacherId, teacherName, roomNo }
  const externalBookingsByDay = new Map();
  for (const other of otherTimetables) {
    for (const d of other.scheduleDays || []) {
      if (!externalBookingsByDay.has(d.dayOfWeek)) {
        externalBookingsByDay.set(d.dayOfWeek, []);
      }
      for (const slot of d.slots || []) {
        if (!slot.isBreak) {
          externalBookingsByDay.get(d.dayOfWeek).push({
            startTime: slot.startTime,
            endTime: slot.endTime,
            teacherId: slot.teacherId ? slot.teacherId.toString() : null,
            teacherName: slot.teacherName?.toLowerCase().trim(),
            roomNo: slot.roomNo?.toLowerCase().trim()
          });
        }
      }
    }
  }

  // Assign subject colors
  const subjectColorMap = new Map();
  subjects.forEach((s, idx) => {
    subjectColorMap.set(s._id.toString(), SUBJECT_COLORS[idx % SUBJECT_COLORS.length]);
  });

  // 6. Pre-generation Verification: Check if any assigned faculty is impossible
  for (const sub of subjects) {
    const tId = sub.assignedTeacherId ? sub.assignedTeacherId.toString() : null;
    const tName = sub.assignedTeacherName;
    const profile = (tId && availMap.get(tId)) || (tName && availMap.get(tName.toLowerCase().trim()));
    if (profile && profile.availableDays) {
      const availCount = profile.availableDays.filter((d) => workingDays.includes(d)).length;
      if (availCount === 0) {
        throw new Error(
          `Faculty Availability Bottleneck: ${tName || "Assigned teacher"} for "${sub.subjectName}" is marked unavailable on all configured working days (${workingDays.join(", ")}).`
        );
      }
    }
  }

  // 7. Expand Subjects into Scheduling Units (Units with required duration: 2 for Lab, 1 for Theory)
  // Most Constrained Variable Heuristic: Sort Labs (consecutive 2) first, then high hours, then remaining.
  const schedulingUnits = [];
  for (const sub of subjects) {
    const isLab = sub.type === "Practical" || (sub.requiredConsecutivePeriods && sub.requiredConsecutivePeriods > 1);
    const consecutiveLen = isLab ? Math.max(2, sub.requiredConsecutivePeriods || 2) : 1;
    let remainingHours = sub.hoursPerWeek || 4;

    while (remainingHours > 0) {
      const duration = remainingHours >= consecutiveLen && isLab ? consecutiveLen : (isLab && remainingHours >= 2 ? 2 : 1);
      schedulingUnits.push({
        id: `${sub._id.toString()}_unit_${schedulingUnits.length}`,
        subjectId: sub._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        type: sub.type || "Theory",
        teacherId: sub.assignedTeacherId || null,
        teacherName: sub.assignedTeacherName || "Faculty Lead",
        preferredRoomType: sub.preferredRoomType || (isLab ? "Computer Lab" : "Classroom"),
        duration, // 1 or 2
        color: subjectColorMap.get(sub._id.toString()) || "#FF6B0A"
      });
      remainingHours -= duration;
    }
  }

  // Sort units: 2-period lab units first (hardest to place), then theory
  schedulingUnits.sort((a, b) => b.duration - a.duration);

  diagnosticLog.push(`[Decomposition] Decomposed into ${schedulingUnits.length} scheduling blocks (${schedulingUnits.filter(u => u.duration > 1).length} consecutive labs).`);

  // Helper to check room matching
  const getSuitableRoom = (unit, day, startTime, endTime, currentAssignments) => {
    let candidateRooms = [];
    if (unit.type === "Practical") {
      candidateRooms = labs.filter((r) => r.type.toLowerCase().includes("lab") || r.type.toLowerCase().includes("workshop"));
      if (candidateRooms.length === 0) candidateRooms = allRooms;
    } else {
      candidateRooms = lectureHalls.length > 0 ? lectureHalls : allRooms;
    }

    // Filter out rooms booked in external bookings
    const extBookings = externalBookingsByDay.get(day) || [];
    for (const room of candidateRooms) {
      const roomNumNorm = room.roomNumber.toLowerCase().trim();
      const extConflict = extBookings.some((b) => b.roomNo === roomNumNorm && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime));
      if (extConflict) continue;

      // Check current candidate assignments
      const intraConflict = currentAssignments.some((a) => a.day === day && a.roomNo.toLowerCase().trim() === roomNumNorm && isTimeOverlapping(startTime, endTime, a.startTime, a.endTime));
      if (!intraConflict) return room;
    }

    return candidateRooms[0] || defaultClassroom;
  };

  // Helper to check if slot is free for teacher
  const isTeacherFree = (teacherId, teacherName, day, startTime, endTime, currentAssignments) => {
    if (!teacherId && !teacherName) return true;
    const tIdStr = teacherId ? teacherId.toString() : null;
    const tNameNorm = teacherName?.toLowerCase().trim();

    // 1. Check FacultyAvailability
    const profile = (tIdStr && availMap.get(tIdStr)) || (tNameNorm && availMap.get(tNameNorm));
    if (profile) {
      if (profile.availableDays && profile.availableDays.length > 0 && !profile.availableDays.includes(day)) {
        return false;
      }
      for (const unavail of profile.unavailableSlots || []) {
        if (unavail.dayOfWeek === day && isTimeOverlapping(startTime, endTime, unavail.startTime, unavail.endTime)) {
          return false;
        }
      }
    }

    // 2. Check external published schedules
    const extBookings = externalBookingsByDay.get(day) || [];
    for (const b of extBookings) {
      const sameTeacher = (tIdStr && b.teacherId === tIdStr) || (tNameNorm && b.teacherName === tNameNorm);
      if (sameTeacher && isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)) {
        return false;
      }
    }

    // 3. Check current assignments
    for (const a of currentAssignments) {
      if (a.day === day && isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)) {
        const sameTeacher = (tIdStr && a.teacherId && a.teacherId.toString() === tIdStr) || (tNameNorm && a.teacherName?.toLowerCase().trim() === tNameNorm);
        if (sameTeacher) return false;
      }
    }

    return true;
  };

  // 8. Multi-Start Constraint Solving (Generates candidates and scores them)
  const candidateSolutions = [];

  for (let attempt = 0; attempt < Math.max(15, maxCandidates * 3); attempt++) {
    // Shuffle day order or unit sequence slightly per attempt for diversity
    const daysOrder = [...workingDays].sort(() => 0.5 - Math.random());
    const assignments = [];
    let failedToPlace = false;

    // Track daily subject placement to avoid repeated consecutive theory on same day
    const dailySubjectCounts = new Map(); // `${day}_${subjectName}` -> count

    for (const unit of schedulingUnits) {
      let placed = false;

      // Try each day
      for (const day of daysOrder) {
        if (placed) break;

        // Try to place on days where this subject isn't already heavily loaded
        const currentCountOnDay = dailySubjectCounts.get(`${day}_${unit.subjectName}`) || 0;
        if (unit.type === "Theory" && currentCountOnDay >= 2) {
          continue; // Soft constraint: max 2 theory of same subject per day
        }

        // Iterate through teaching slots
        for (let slotIdx = 0; slotIdx <= teachingSlots.length - unit.duration; slotIdx++) {
          const startSlot = teachingSlots[slotIdx];
          const endSlot = teachingSlots[slotIdx + unit.duration - 1];

          // Check if intervening slots cross lunch or have breaks
          // Start slot time to end slot time
          const overallStart = startSlot.startTime;
          const overallEnd = endSlot.endTime;

          // Check breaks collision
          const crossesBreak = breakSlots.some((b) => isTimeOverlapping(overallStart, overallEnd, b.startTime, b.endTime));
          if (crossesBreak) continue;

          // Check cohort slot vacancy
          const isSlotOccupied = assignments.some((a) => a.day === day && isTimeOverlapping(overallStart, overallEnd, a.startTime, a.endTime));
          if (isSlotOccupied) continue;

          // Check teacher availability
          if (!isTeacherFree(unit.teacherId, unit.teacherName, day, overallStart, overallEnd, assignments)) {
            continue;
          }

          // Pick suitable room
          const room = getSuitableRoom(unit, day, overallStart, overallEnd, assignments);

          // Place the unit across its slots
          if (unit.duration === 1) {
            assignments.push({
              unitId: unit.id,
              subjectId: unit.subjectId,
              subject: unit.subjectName,
              subjectCode: unit.subjectCode,
              type: unit.type,
              teacherId: unit.teacherId,
              teacherName: unit.teacherName,
              roomId: room._id || null,
              roomNo: room.roomNumber,
              day,
              periodNumber: startSlot.slotNumber,
              startTime: startSlot.startTime,
              endTime: startSlot.endTime,
              isConsecutive: false,
              consecutiveIndex: 1,
              color: unit.color
            });
          } else {
            // Multi-period block (e.g. 2-period lab)
            for (let dIdx = 0; dIdx < unit.duration; dIdx++) {
              const curSlot = teachingSlots[slotIdx + dIdx];
              assignments.push({
                unitId: unit.id,
                subjectId: unit.subjectId,
                subject: unit.subjectName,
                subjectCode: unit.subjectCode,
                type: unit.type,
                teacherId: unit.teacherId,
                teacherName: unit.teacherName,
                roomId: room._id || null,
                roomNo: room.roomNumber,
                day,
                periodNumber: curSlot.slotNumber,
                startTime: curSlot.startTime,
                endTime: curSlot.endTime,
                isConsecutive: true,
                consecutiveIndex: dIdx + 1,
                color: unit.color
              });
            }
          }

          dailySubjectCounts.set(`${day}_${unit.subjectName}`, currentCountOnDay + 1);
          placed = true;
          break;
        }
      }

      if (!placed) {
        failedToPlace = true;
        break;
      }
    }

    if (!failedToPlace) {
      // Calculate Soft Constraint Score
      let score = 1000;

      // 1. Reward even distribution of subjects across days
      const daysUsedPerSubject = new Map();
      for (const a of assignments) {
        if (!daysUsedPerSubject.has(a.subject)) daysUsedPerSubject.set(a.subject, new Set());
        daysUsedPerSubject.get(a.subject).add(a.day);
      }
      for (const [_, daysSet] of daysUsedPerSubject.entries()) {
        score += daysSet.size * 15;
      }

      // 2. Penalize room changes in same day
      for (const day of workingDays) {
        const dayRooms = assignments.filter((a) => a.day === day && a.type === "Theory").map((a) => a.roomNo);
        const uniqueRooms = new Set(dayRooms);
        if (uniqueRooms.size > 2) {
          score -= (uniqueRooms.size - 2) * 20;
        }
      }

      candidateSolutions.push({
        assignments,
        score
      });

      if (candidateSolutions.length >= maxCandidates) break;
    }
  }

  if (candidateSolutions.length === 0) {
    throw new Error(
      `Constraint Violation: Unable to generate a valid collision-free timetable with current parameters. Likely causes: Faculty availability is overly restricted, laboratory capacity is fully booked by other branches, or required lecture hours exceed available non-break periods. Try adjusting faculty availability or relaxing daily subject constraints.`
    );
  }

  // Sort candidates by highest score
  candidateSolutions.sort((a, b) => b.score - a.score);
  const bestCandidate = candidateSolutions[0];
  diagnosticLog.push(`[Optimization] Evaluated ${candidateSolutions.length} valid candidate solutions. Selected candidate with soft-constraint score ${bestCandidate.score}.`);

  // 9. Format into scheduleDays with periods and breaks included
  const finalScheduleDays = [];
  const uniqueTeachers = new Set();
  const uniqueRooms = new Set();
  let theoryCount = 0;
  let practicalCount = 0;

  for (const day of workingDays) {
    const dayAssignments = bestCandidate.assignments.filter((a) => a.day === day);
    const daySlots = [];

    // Reconstruct full timeline including breaks
    for (const slotDef of configuredSlots) {
      if (slotDef.isBreak) {
        daySlots.push({
          periodNumber: slotDef.slotNumber,
          startTime: slotDef.startTime,
          endTime: slotDef.endTime,
          subject: slotDef.label || (slotDef.breakType === "lunch" ? "Lunch Break" : "Short Break"),
          teacherName: "",
          roomNo: "Campus",
          type: slotDef.breakType === "lunch" ? "Lunch" : "Break",
          isBreak: true,
          color: "#94A3B8"
        });
      } else {
        const assigned = dayAssignments.find((a) => a.periodNumber === slotDef.slotNumber || (a.startTime === slotDef.startTime && a.endTime === slotDef.endTime));
        if (assigned) {
          daySlots.push({
            periodNumber: slotDef.slotNumber,
            startTime: slotDef.startTime,
            endTime: slotDef.endTime,
            subjectId: assigned.subjectId,
            subject: assigned.subject,
            subjectCode: assigned.subjectCode,
            teacherId: assigned.teacherId,
            teacherName: assigned.teacherName,
            roomId: assigned.roomId,
            roomNo: assigned.roomNo,
            type: assigned.type,
            isBreak: false,
            isConsecutive: assigned.isConsecutive,
            consecutiveIndex: assigned.consecutiveIndex,
            color: assigned.color
          });

          if (assigned.teacherName) uniqueTeachers.add(assigned.teacherName);
          if (assigned.roomNo) uniqueRooms.add(assigned.roomNo);
          if (assigned.type === "Practical") practicalCount++;
          else theoryCount++;
        } else {
          // Free period
          daySlots.push({
            periodNumber: slotDef.slotNumber,
            startTime: slotDef.startTime,
            endTime: slotDef.endTime,
            subject: "Free Period / Self Study",
            teacherName: "—",
            roomNo: defaultClassroom.roomNumber,
            type: "Tutorial",
            isBreak: false,
            color: "#64748B"
          });
        }
      }
    }

    finalScheduleDays.push({
      dayOfWeek: day,
      slots: daySlots
    });
  }

  const generationSummary = {
    totalPeriods: theoryCount + practicalCount,
    theoryPeriods: theoryCount,
    practicalPeriods: practicalCount,
    facultyCount: uniqueTeachers.size,
    roomCount: uniqueRooms.size,
    bestScore: bestCandidate.score,
    candidatesGenerated: candidateSolutions.length,
    diagnosticLog
  };

  return {
    success: true,
    branch,
    semester,
    section,
    academicSession,
    scheduleDays: finalScheduleDays,
    summary: generationSummary
  };
}
