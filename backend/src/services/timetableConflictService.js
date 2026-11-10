/**
 * CollegeOS Timetable Conflict Detection Engine
 * Performs comprehensive hard and soft constraint validation.
 */

import Timetable from "../models/Timetable.js";
import FacultyAvailability from "../models/FacultyAvailability.js";
import CampusRoom from "../models/CampusRoom.js";
import Subject from "../models/Subject.js";

// Helper to check time overlap: (start1 < end2) && (end1 > start2)
export function isTimeOverlapping(start1, end1, start2, end2) {
  if (!start1 || !end1 || !start2 || !end2) return false;
  // Convert "HH:MM" to minutes for reliable comparison
  const toMinutes = (t) => {
    const parts = t.trim().split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Validate a schedule against internal and cross-department institutional bookings.
 * @param {Object} params
 * @param {Array} params.scheduleDays - Array of { dayOfWeek, slots: [...] }
 * @param {String} params.branch
 * @param {String} params.semester
 * @param {String} params.section
 * @param {String} params.academicSession
 * @param {Array} [params.breaks] - Configured breaks from TimetableConfig
 * @param {String} [params.excludeTimetableId] - ID to ignore when checking other published schedules
 */
export async function validateTimetableConflicts({
  scheduleDays,
  branch,
  semester,
  section = "A",
  academicSession = "2025-2026",
  breaks = [],
  excludeTimetableId = null
}) {
  const blockingErrors = [];
  const warnings = [];
  const suggestions = [];

  const normSem = (s) => {
    if (!s) return "";
    const str = String(s).trim();
    if (/^\d+$/.test(str)) return `Semester ${str}`;
    return str;
  };
  const currentNormSem = normSem(semester);

  // 1. Fetch all other PUBLISHED or UNDER REVIEW timetables in the institution for cross-booking checks
  const crossFilter = {
    academicSession,
    isMaster: true,
    status: { $in: ["published", "approved"] }
  };
  if (excludeTimetableId) {
    crossFilter._id = { $ne: excludeTimetableId };
  }
  const otherTimetables = await Timetable.find(crossFilter).lean();

  // 2. Fetch all faculty availability profiles
  const availabilities = await FacultyAvailability.find({}).lean();
  const availMap = new Map();
  for (const fa of availabilities) {
    availMap.set(fa.teacherId.toString(), fa);
    availMap.set(fa.teacherName.toLowerCase().trim(), fa);
  }

  // 3. Fetch rooms
  const rooms = await CampusRoom.find({}).lean();
  const roomMap = new Map();
  for (const r of rooms) {
    roomMap.set(r.roomNumber.toLowerCase().trim(), r);
    if (r._id) roomMap.set(r._id.toString(), r);
  }

  // 4. Fetch subjects for this branch and semester
  const subjects = await Subject.find({ branch, semester }).lean();
  const subjectMap = new Map();
  for (const s of subjects) {
    subjectMap.set(s.subjectName.toLowerCase().trim(), s);
    subjectMap.set(s.subjectCode.toLowerCase().trim(), s);
    if (s._id) subjectMap.set(s._id.toString(), s);
  }

  // Tracking structures for intra-schedule checks
  const teacherWeeklyLoad = new Map(); // teacherId/name -> count of scheduled periods
  const subjectWeeklyPeriods = new Map(); // subjectName/code -> count of scheduled periods

  for (const daySchedule of scheduleDays || []) {
    const day = daySchedule.dayOfWeek;
    const slots = daySchedule.slots || [];

    // Internal slot-to-slot comparison within this cohort on this day
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.isBreak) continue;

      const subName = slot.subject || "Unnamed Subject";
      const teacherName = slot.teacherName || "Unassigned Faculty";
      const teacherIdStr = slot.teacherId ? slot.teacherId.toString() : null;
      const roomNo = slot.roomNo || "Room 101";

      // Track loads
      if (teacherIdStr || teacherName) {
        const key = teacherIdStr || teacherName;
        teacherWeeklyLoad.set(key, (teacherWeeklyLoad.get(key) || 0) + 1);
      }
      subjectWeeklyPeriods.set(subName, (subjectWeeklyPeriods.get(subName) || 0) + 1);

      // Check break collisions
      for (const brk of breaks) {
        if (isTimeOverlapping(slot.startTime, slot.endTime, brk.startTime, brk.endTime)) {
          blockingErrors.push({
            code: "BREAK_OVERLAP",
            day,
            slot: `${slot.startTime} - ${slot.endTime}`,
            subject: subName,
            message: `"${subName}" overlaps with scheduled ${brk.label || "Break"} (${brk.startTime} - ${brk.endTime}) on ${day}.`,
            severity: "blocking"
          });
        }
      }

      // Check faculty availability
      const facultyProfile = (teacherIdStr && availMap.get(teacherIdStr)) || (teacherName && availMap.get(teacherName.toLowerCase().trim()));
      if (facultyProfile) {
        // Check availableDays
        if (facultyProfile.availableDays && facultyProfile.availableDays.length > 0) {
          if (!facultyProfile.availableDays.includes(day)) {
            blockingErrors.push({
              code: "FACULTY_UNAVAILABLE_DAY",
              day,
              slot: `${slot.startTime} - ${slot.endTime}`,
              teacher: teacherName,
              message: `${teacherName} is not available on ${day} (Available days: ${facultyProfile.availableDays.join(", ")}).`,
              severity: "blocking"
            });
          }
        }

        // Check unavailableSlots
        for (const unavail of facultyProfile.unavailableSlots || []) {
          if (unavail.dayOfWeek === day && isTimeOverlapping(slot.startTime, slot.endTime, unavail.startTime, unavail.endTime)) {
            blockingErrors.push({
              code: "FACULTY_UNAVAILABLE_TIME",
              day,
              slot: `${slot.startTime} - ${slot.endTime}`,
              teacher: teacherName,
              message: `${teacherName} is unavailable on ${day} from ${unavail.startTime} to ${unavail.endTime} (${unavail.reason || "Duty"}).`,
              severity: "blocking"
            });
          }
        }
      }

      // Check room validity & lab requirements
      const roomObj = roomMap.get(roomNo.toLowerCase().trim());
      const subObj = subjectMap.get(subName.toLowerCase().trim()) || (slot.subjectCode && subjectMap.get(slot.subjectCode.toLowerCase().trim()));
      if (subObj) {
        const isLabRequired = subObj.type === "Practical" || slot.type === "Practical";
        if (isLabRequired && roomObj && roomObj.type === "Classroom") {
          blockingErrors.push({
            code: "INVALID_LAB_ROOM",
            day,
            slot: `${slot.startTime} - ${slot.endTime}`,
            subject: subName,
            room: roomNo,
            message: `Practical subject "${subName}" is assigned to regular Lecture Hall ${roomNo}. Practical sessions must use a designated Laboratory.`,
            severity: "blocking"
          });
        }
      }

      // Check room unavailability
      if (roomObj && roomObj.unavailableSlots) {
        for (const unavail of roomObj.unavailableSlots) {
          if (unavail.dayOfWeek === day && isTimeOverlapping(slot.startTime, slot.endTime, unavail.startTime, unavail.endTime)) {
            blockingErrors.push({
              code: "ROOM_UNAVAILABLE",
              day,
              slot: `${slot.startTime} - ${slot.endTime}`,
              room: roomNo,
              message: `Facility ${roomNo} is unavailable on ${day} (${unavail.startTime} - ${unavail.endTime}): ${unavail.reason || "Maintenance"}.`,
              severity: "blocking"
            });
          }
        }
      }

      // Check intra-cohort conflicts (e.g. 2 classes for this cohort scheduled at same time)
      for (let j = i + 1; j < slots.length; j++) {
        const slot2 = slots[j];
        if (slot2.isBreak) continue;

        if (isTimeOverlapping(slot.startTime, slot.endTime, slot2.startTime, slot2.endTime)) {
          blockingErrors.push({
            code: "CLASS_DOUBLE_BOOKING",
            day,
            slot: `${slot.startTime} - ${slot.endTime}`,
            message: `Class conflict for ${branch} ${semester}: "${subName}" and "${slot2.subject}" are both scheduled simultaneously on ${day} (${slot.startTime} - ${slot.endTime}).`,
            severity: "blocking"
          });
        }
      }

      // Cross-checking against ALL OTHER published timetables in the college
      for (const otherTt of otherTimetables) {
        // Skip comparing against own document or own cohort
        if (excludeTimetableId && otherTt._id && otherTt._id.toString() === excludeTimetableId.toString()) {
          continue;
        }
        if (otherTt.branch === branch && normSem(otherTt.semester) === currentNormSem && (otherTt.section || "A") === (section || "A")) {
          continue;
        }

        const otherDaySchedule = (otherTt.scheduleDays || []).find((d) => d.dayOfWeek === day);
        if (!otherDaySchedule) continue;

        for (const otherSlot of otherDaySchedule.slots || []) {
          if (otherSlot.isBreak) continue;

          // Check time overlap
          if (isTimeOverlapping(slot.startTime, slot.endTime, otherSlot.startTime, otherSlot.endTime)) {
            // Check teacher double booking
            const sameTeacher =
              (teacherIdStr && otherSlot.teacherId && teacherIdStr === otherSlot.teacherId.toString()) ||
              (teacherName && otherSlot.teacherName && teacherName.toLowerCase() === otherSlot.teacherName.toLowerCase());

            if (sameTeacher) {
              blockingErrors.push({
                code: "TEACHER_DOUBLE_BOOKING",
                day,
                slot: `${slot.startTime} - ${slot.endTime}`,
                teacher: teacherName,
                conflictWith: `${otherTt.branch} ${otherTt.semester} (${otherSlot.subject})`,
                message: `Teacher Double Booking: ${teacherName} is already assigned to "${otherSlot.subject}" in ${otherTt.branch} ${otherTt.semester} on ${day} (${otherSlot.startTime} - ${otherSlot.endTime}) in ${otherSlot.roomNo}.`,
                severity: "blocking"
              });
            }

            // Check room double booking
            if (roomNo && otherSlot.roomNo && roomNo.toLowerCase() === otherSlot.roomNo.toLowerCase()) {
              blockingErrors.push({
                code: "ROOM_DOUBLE_BOOKING",
                day,
                slot: `${slot.startTime} - ${slot.endTime}`,
                room: roomNo,
                conflictWith: `${otherTt.branch} ${otherTt.semester} (${otherSlot.subject})`,
                message: `Room Double Booking: ${roomNo} is already occupied by "${otherSlot.subject}" in ${otherTt.branch} ${otherTt.semester} on ${day} (${otherSlot.startTime} - ${otherSlot.endTime}).`,
                severity: "blocking"
              });
            }
          }
        }
      }
    }
  }

  // Evaluate weekly requirements & warnings
  for (const sub of subjects) {
    const requiredHours = sub.hoursPerWeek || 4;
    const actualScheduled = subjectWeeklyPeriods.get(sub.subjectName) || 0;

    if (actualScheduled < requiredHours) {
      warnings.push({
        code: "DEFICIT_HOURS",
        subject: sub.subjectName,
        required: requiredHours,
        scheduled: actualScheduled,
        message: `Subject "${sub.subjectName}" requires ${requiredHours} weekly periods, but only ${actualScheduled} are scheduled (${requiredHours - actualScheduled} missing).`,
        severity: "warning"
      });
    } else if (actualScheduled > requiredHours) {
      warnings.push({
        code: "EXCESS_HOURS",
        subject: sub.subjectName,
        required: requiredHours,
        scheduled: actualScheduled,
        message: `Subject "${sub.subjectName}" is assigned ${actualScheduled} periods, exceeding its curriculum requirement of ${requiredHours} periods.`,
        severity: "warning"
      });
    }
  }

  // Evaluate faculty workload warnings
  for (const [key, count] of teacherWeeklyLoad.entries()) {
    const profile = availMap.get(key) || availMap.get(key.toLowerCase?.() || "");
    const maxLoad = profile?.maxWeeklyLoad || 22;
    if (count > maxLoad) {
      warnings.push({
        code: "FACULTY_OVERLOAD",
        teacher: profile?.teacherName || key,
        scheduled: count,
        max: maxLoad,
        message: `Faculty workload warning: ${profile?.teacherName || key} is assigned ${count} periods (maximum advised: ${maxLoad} periods/week).`,
        severity: "warning"
      });
    }
  }

  return {
    isValid: blockingErrors.length === 0,
    blockingErrors,
    warnings,
    suggestions,
    summary: {
      blockingCount: blockingErrors.length,
      warningCount: warnings.length,
      suggestionCount: suggestions.length
    }
  };
}
