import mongoose from "mongoose";
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connectDB, disconnectDB } from "../config/db.js";
import AcademicAttendanceConfig from "../models/AcademicAttendanceConfig.js";
import DailyCollegeAttendance from "../models/DailyCollegeAttendance.js";
import SubjectAttendanceSession from "../models/SubjectAttendanceSession.js";
import SubjectAttendanceRecord from "../models/SubjectAttendanceRecord.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Subject from "../models/Subject.js";

function normalizeDate(d) {
  const date = new Date(d);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function syncAttendance() {
  try {
    console.log("[Attendance Sync] Connecting to database...");
    await connectDB();

    const branch = "CSE";
    const semester = "5th Semester";
    const section = "A";
    const academicSession = "2025-2026";

    // 1. Find Staff (Teacher / HOD / Coordinator)
    const staffUser = await User.findOne({
      role: { $in: ["teacher", "hod", "coordinator", "principal", "admin"] }
    }) || await User.findOne({});

    if (!staffUser) {
      console.error("[Attendance Sync] No staff user found!");
      return;
    }

    // 2. Find or configure Satyam student
    let satyam = await User.findOne({ email: "satyam7209452235@gmail.com" });
    if (!satyam) {
      satyam = await User.findOne({ role: "student" });
    }

    if (satyam) {
      await StudentProfile.findOneAndUpdate(
        { userId: satyam._id },
        {
          userId: satyam._id,
          branch: "CSE",
          semester: "5th Semester",
          academicYear: "3rd Year",
          enrollmentNo: "SUB-CSE-2024-042",
          verificationStatus: "verified"
        },
        { upsert: true }
      );
    }

    // Find all students
    let students = await User.find({ role: "student" });
    if (students.length === 0 && satyam) {
      students = [satyam];
    }

    console.log(`[Attendance Sync] Enrolled students count: ${students.length}`);

    // 3. Setup Academic Attendance Config
    const commencementDate = normalizeDate("2026-11-01T00:00:00.000Z");
    const academicEndDate = normalizeDate("2027-04-30T00:00:00.000Z");

    const config = await AcademicAttendanceConfig.findOneAndUpdate(
      { academicSession, branch, semester, section },
      {
        academicSession,
        branch,
        semester,
        section,
        academicYear: "3rd Year",
        commencementDate,
        academicEndDate,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        holidays: [
          { date: normalizeDate("2026-11-08T00:00:00.000Z"), title: "Guru Nanak Jayanti", type: "holiday" },
          { date: normalizeDate("2026-12-25T00:00:00.000Z"), title: "Christmas Day", type: "holiday" },
          { date: normalizeDate("2027-01-26T00:00:00.000Z"), title: "Republic Day", type: "holiday" }
        ],
        specialWorkingDays: [],
        minAttendancePercentage: 60,
        configuredBy: staffUser._id
      },
      { upsert: true, new: true }
    );
    console.log("[Attendance Sync] AcademicAttendanceConfig initialized:", config._id.toString());

    // 4. Ensure Subjects exist in Subject collection
    const subjectsList = [
      { name: "Operating Systems", code: "CS-501", teacherName: "Dr. Sunita Deshpande", credits: 4 },
      { name: "Database Management Systems", code: "CS-502", teacherName: "Er. Reena Singh", credits: 4 },
      { name: "Advanced Computer Networks", code: "CS-503", teacherName: "Er. Deepak Kumar", credits: 4 },
      { name: "OOPS with Java", code: "PCS-504P", teacherName: "Er. Praveen Kumar", credits: 3 },
      { name: "Internet of Things", code: "PCS-505P", teacherName: "Er. Ujjawal Mishra", credits: 3 },
      { name: "Management & Technology", code: "PCS-501A", teacherName: "Er. Amit Kumar", credits: 3 },
      { name: "Indian Constitution", code: "PIC-005", teacherName: "Miss M", credits: 2 },
      { name: "SCA", code: "PSCA-005P", teacherName: "Er. Rajesh Parihar", credits: 2 }
    ];

    for (const sub of subjectsList) {
      await Subject.findOneAndUpdate(
        { branch, semester, subjectCode: sub.code },
        {
          branch,
          semester,
          subjectName: sub.name,
          subjectCode: sub.code,
          teacherName: sub.teacherName,
          credits: sub.credits,
          status: "active"
        },
        { upsert: true }
      );
    }
    console.log("[Attendance Sync] Curriculum subjects verified.");

    // 5. Clean up old test attendance records for clear demonstration
    await DailyCollegeAttendance.deleteMany({ branch, semester, section });
    await SubjectAttendanceSession.deleteMany({ branch, semester, section });
    await SubjectAttendanceRecord.deleteMany({ branch, semester, section });

    // 6. Seed Daily College Attendance (System A)
    // Only completed past dates prior to current date (Nov 3, 2026)
    const collegeDates = [
      "2026-11-02"
    ];

    console.log(`[Attendance Sync] Seeding ${collegeDates.length} completed Daily College Attendance days...`);

    for (let i = 0; i < collegeDates.length; i++) {
      const d = normalizeDate(`${collegeDates[i]}T00:00:00.000Z`);

      for (const st of students) {
        let status = "present";

        await DailyCollegeAttendance.create({
          studentId: st._id,
          branch,
          semester,
          section,
          academicSession,
          academicYear: "3rd Year",
          date: d,
          status,
          markedBy: staffUser._id,
          markedByName: staffUser.fullName || staffUser.name || "Er. Reena Singh",
          markedByRole: staffUser.role || "teacher",
          remarks: "Present in college",
          auditHistory: []
        });
      }
    }
    console.log("[Attendance Sync] Daily College Attendance seeded successfully for completed date 2026-11-02.");

    // 7. Seed Subject Lecture Attendance Sessions & Records (System B)
    // Independent lectures per subject
    const subjectPlans = [
      {
        subject: "Operating Systems",
        code: "CS-501",
        faculty: "Dr. Sunita Deshpande",
        room: "LT-101",
        totalSessions: 9,
        // Satyam attended 8, missed 1 -> 88.9%
        satyamMissedIndices: [4]
      },
      {
        subject: "Database Management Systems",
        code: "CS-502",
        faculty: "Er. Reena Singh",
        room: "Room 302",
        totalSessions: 7,
        // Satyam attended 4, missed 3 -> 57.1% (Below 60% Shortage Warning!)
        satyamMissedIndices: [1, 3, 5]
      },
      {
        subject: "Advanced Computer Networks",
        code: "CS-503",
        faculty: "Er. Deepak Kumar",
        room: "Room 302",
        totalSessions: 8,
        // Satyam attended 7, missed 1 -> 87.5%
        satyamMissedIndices: [2]
      },
      {
        subject: "OOPS with Java",
        code: "PCS-504P",
        faculty: "Er. Praveen Kumar",
        room: "Comp. Lab",
        totalSessions: 8,
        // Satyam attended 6, missed 2 -> 75.0%
        satyamMissedIndices: [2, 6]
      },
      {
        subject: "Internet of Things",
        code: "PCS-505P",
        faculty: "Er. Ujjawal Mishra",
        room: "Room 302",
        totalSessions: 8,
        // Satyam attended 5, missed 3 -> 62.5%
        satyamMissedIndices: [1, 4, 7]
      },
      {
        subject: "Management & Technology",
        code: "PCS-501A",
        faculty: "Er. Amit Kumar",
        room: "Room 302",
        totalSessions: 6,
        // Satyam attended 6 -> 100%
        satyamMissedIndices: []
      },
      {
        subject: "Indian Constitution",
        code: "PIC-005",
        faculty: "Miss M",
        room: "Room 302",
        totalSessions: 4,
        // Satyam attended 3, missed 1 -> 75.0%
        satyamMissedIndices: [1]
      },
      {
        subject: "SCA",
        code: "PSCA-005P",
        faculty: "Er. Rajesh Parihar",
        room: "Sports Ground",
        totalSessions: 5,
        // Satyam attended 5 -> 100%
        satyamMissedIndices: []
      }
    ];

    let totalSessionsCreated = 0;
    let totalRecordsCreated = 0;

    for (const plan of subjectPlans) {
      for (let sIdx = 0; sIdx < plan.totalSessions; sIdx++) {
        // Distribute sessions across collegeDates
        const dateStr = collegeDates[sIdx % collegeDates.length];
        const sessionDate = normalizeDate(`${dateStr}T00:00:00.000Z`);
        const periodNum = (sIdx % 7) + 1;

        const session = await SubjectAttendanceSession.create({
          subject: plan.subject,
          subjectCode: plan.code,
          branch,
          semester,
          section,
          academicSession,
          academicYear: "3rd Year",
          date: sessionDate,
          periodNumber: periodNum,
          startTime: `${8 + periodNum}:00 AM`,
          endTime: `${9 + periodNum}:00 AM`,
          roomNo: plan.room,
          facultyId: staffUser._id,
          facultyName: plan.faculty,
          facultyRole: "teacher",
          sessionType: plan.code.includes("P") ? "lab" : "theory",
          topic: `Unit ${Math.floor(sIdx / 2) + 1} - Key Topic Discussion ${sIdx + 1}`,
          status: "conducted",
          totalEnrolled: students.length,
          presentCount: 0,
          absentCount: 0,
          submittedAt: new Date()
        });
        totalSessionsCreated++;

        let pCount = 0;
        let aCount = 0;

        for (const st of students) {
          let isAttended = true;
          if (st._id.toString() === satyam._id.toString()) {
            if (plan.satyamMissedIndices.includes(sIdx)) {
              isAttended = false;
            }
          }

          const status = isAttended ? "present" : "absent";
          if (status === "present") pCount++;
          else aCount++;

          await SubjectAttendanceRecord.create({
            sessionId: session._id,
            studentId: st._id,
            studentName: st.fullName || st.name || "Student",
            rollNumber: "SUB-CSE-2024-042",
            subject: plan.subject,
            subjectCode: plan.code,
            branch,
            semester,
            section,
            date: sessionDate,
            status,
            remarks: status === "present" ? "Attended full lecture" : "Absent",
            auditHistory: []
          });
          totalRecordsCreated++;
        }

        session.presentCount = pCount;
        session.absentCount = aCount;
        await session.save();
      }
    }

    console.log(`[Attendance Sync] Seeded ${totalSessionsCreated} Subject Sessions and ${totalRecordsCreated} Attendance Records.`);
    console.log("[Attendance Sync] All calculations strictly distinct and verifiable!");

    await disconnectDB();
    console.log("[Attendance Sync] Completed successfully!");
    setTimeout(() => process.exit(0), 500);
  } catch (err) {
    console.error("[Attendance Sync] Fatal Error:", err);
    process.exit(1);
  }
}

syncAttendance();
