import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import HODProfile from "../models/HODProfile.js";
import CoordinatorProfile from "../models/CoordinatorProfile.js";
import PrincipalProfile from "../models/PrincipalProfile.js";
import Attendance from "../models/Attendance.js";
import ExamMark from "../models/ExamMark.js";
import Assignment from "../models/Assignment.js";
import Timetable from "../models/Timetable.js";
import Notice from "../models/Notice.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Notification from "../models/Notification.js";
import { connectDB, disconnectDB } from "../config/db.js";

/**
 * Seed initial institutional demo accounts & operational academic records in MongoDB.
 * Ensures all 6 roles have live data for evaluation, testing, and production demos.
 */
export async function seedInitialData() {
  await connectDB();
  console.log("[Seed] Checking and seeding institutional records in MongoDB...");

  // ==========================================
  // 1. SEED ALL 6 INSTITUTIONAL ROLES
  // ==========================================

  // A. Student
  let student = await User.findOne({ email: "student.demo@subharti.org" });
  if (!student) {
    const hash = await User.hashPassword("Student@123");
    student = await User.create({
      fullName: "Rishabh Singhania",
      email: "student.demo@subharti.org",
      passwordHash: hash,
      role: "student",
      status: "verified",
      isEmailVerified: true,
      bio: "Final year diploma candidate in Computer Science & Engineering. Specializing in Cloud Native Systems & Edge AI.",
      phone: "+91 98765 43210"
    });
    console.log("[Seed] Created student: student.demo@subharti.org");
  }

  let studentProfile = await StudentProfile.findOne({ userId: student._id });
  if (!studentProfile) {
    studentProfile = await StudentProfile.create({
      userId: student._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      enrollmentNo: "SVSU/2024/CSE/042",
      verificationStatus: "verified",
      attendancePercentage: 92,
      skills: ["Python", "JavaScript", "React", "Docker", "Embedded C"],
      bio: student.bio
    });
    console.log("[Seed] Created StudentProfile.");
  }

  // B. Teacher
  let teacher = await User.findOne({ email: "faculty.demo@subharti.org" });
  if (!teacher) {
    const hash = await User.hashPassword("Faculty@123");
    teacher = await User.create({
      fullName: "Dr. Sunita Deshpande",
      email: "faculty.demo@subharti.org",
      passwordHash: hash,
      role: "teacher",
      status: "verified",
      isEmailVerified: true,
      bio: "Associate Professor in CSE. Lead instructor for Operating Systems and Distributed Cloud Networks.",
      phone: "+91 98112 23344"
    });
    console.log("[Seed] Created teacher: faculty.demo@subharti.org");
  }

  let teacherProfile = await TeacherProfile.findOne({ userId: teacher._id });
  if (!teacherProfile) {
    teacherProfile = await TeacherProfile.create({
      userId: teacher._id,
      department: "CSE",
      employeeId: "EMP-CSE-108",
      designation: "Associate Professor / Systems Lead",
      responsibilities: "OS Laboratory Lead, Curriculum Advisory Committee",
      approvalStatus: "approved",
      subjects: ["Operating Systems", "Computer Networks", "Database Management Systems"],
      bio: teacher.bio
    });
    console.log("[Seed] Created TeacherProfile.");
  }

  // C. Head of Department (HOD)
  let hod = await User.findOne({ email: "hod.demo@subharti.org" });
  if (!hod) {
    const hash = await User.hashPassword("Hod@123");
    hod = await User.create({
      fullName: "Prof. Arvind Kulkarni",
      email: "hod.demo@subharti.org",
      passwordHash: hash,
      role: "hod",
      status: "verified",
      isEmailVerified: true,
      bio: "Head of Department, Computer Science & Engineering. Senior Fellow of Computer Society of India.",
      phone: "+91 97223 34455"
    });
    console.log("[Seed] Created HOD: hod.demo@subharti.org");
  }

  let hodProfile = await HODProfile.findOne({ userId: hod._id });
  if (!hodProfile) {
    hodProfile = await HODProfile.create({
      userId: hod._id,
      department: "CSE",
      employeeId: "EMP-CSE-HOD",
      leadershipDetails: "Departmental Administration, NBA Accreditation Coordinator, Faculty Development Chair",
      approvalStatus: "approved",
      bio: hod.bio
    });
    console.log("[Seed] Created HODProfile.");
  }

  // D. Academic Coordinator
  let coordinator = await User.findOne({ email: "coordinator.demo@subharti.org" });
  if (!coordinator) {
    const hash = await User.hashPassword("Coord@123");
    coordinator = await User.create({
      fullName: "Er. Meenakshi Sundaram",
      email: "coordinator.demo@subharti.org",
      passwordHash: hash,
      role: "coordinator",
      status: "verified",
      isEmailVerified: true,
      bio: "Senior Academic Coordinator. Managing diploma timetables, internal assessments, and student mentoring groups.",
      phone: "+91 96334 45566"
    });
    console.log("[Seed] Created coordinator: coordinator.demo@subharti.org");
  }

  let coordProfile = await CoordinatorProfile.findOne({ userId: coordinator._id });
  if (!coordProfile) {
    coordProfile = await CoordinatorProfile.create({
      userId: coordinator._id,
      department: "CSE",
      employeeId: "EMP-COORD-004",
      category: "Diploma Academic Operations",
      responsibilities: "Timetable Scheduling, Mid-term Evaluation Audits, Student Group Mentoring",
      approvalStatus: "approved",
      bio: coordinator.bio
    });
    console.log("[Seed] Created CoordinatorProfile.");
  }

  // E. Principal / Executive Director
  let principal = await User.findOne({ email: "principal.demo@subharti.org" });
  if (!principal) {
    const hash = await User.hashPassword("Principal@123");
    principal = await User.create({
      fullName: "Dr. Rajeshwar Prasad",
      email: "principal.demo@subharti.org",
      passwordHash: hash,
      role: "principal",
      status: "verified",
      isEmailVerified: true,
      bio: "Principal, Subharti Polytechnic. 28+ years in engineering pedagogy and polytechnic institution leadership.",
      phone: "+91 95445 56677"
    });
    console.log("[Seed] Created principal: principal.demo@subharti.org");
  }

  let principalProfile = await PrincipalProfile.findOne({ userId: principal._id });
  if (!principalProfile) {
    principalProfile = await PrincipalProfile.create({
      userId: principal._id,
      designation: "Principal / Executive Director",
      employeeId: "DIR-SVSU-001",
      approvalStatus: "approved",
      bio: principal.bio
    });
    console.log("[Seed] Created PrincipalProfile.");
  }

  // F. System Administrator
  let admin = await User.findOne({ email: "admin.demo@subharti.org" });
  if (!admin) {
    const hash = await User.hashPassword("Admin@123");
    admin = await User.create({
      fullName: "CollegeOS Core Administrator",
      email: "admin.demo@subharti.org",
      passwordHash: hash,
      role: "admin",
      status: "verified",
      isEmailVerified: true,
      bio: "Superuser & CollegeOS Enterprise Gateway Administrator. Managing access policies, data audit, and system security."
    });
    console.log("[Seed] Created admin: admin.demo@subharti.org");
  }

  // ==========================================
  // 2. SEED ATTENDANCE RECORDS
  // ==========================================
  const attendanceCount = await Attendance.countDocuments({ studentId: student._id });
  if (attendanceCount === 0) {
    const subjects = [
      "Operating Systems",
      "Computer Networks",
      "Database Management Systems",
      "Cloud Computing",
      "Software Engineering"
    ];

    const attendanceRecords = [];
    // Generate 15 distinct dates over past 3 weeks
    for (let dayOffset = 1; dayOffset <= 15; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(9, 0, 0, 0);

      // Skip Sundays
      if (date.getDay() === 0) continue;

      for (let s = 0; s < subjects.length; s++) {
        // High present probability (~92%)
        const isPresent = (dayOffset + s) % 11 !== 0;
        attendanceRecords.push({
          studentId: student._id,
          branch: "CSE",
          academicYear: "3rd Year",
          semester: "Semester 5",
          subject: subjects[s],
          date: new Date(date),
          status: isPresent ? "present" : "absent",
          markedBy: teacher._id,
          remarks: isPresent ? "Active participation" : "Unexcused absence"
        });
      }
    }

    if (attendanceRecords.length > 0) {
      await Attendance.insertMany(attendanceRecords);
      console.log(`[Seed] Seeded ${attendanceRecords.length} realistic attendance records.`);
    }
  }

  // ==========================================
  // 3. SEED EXAMINATION MARKS
  // ==========================================
  const examCount = await ExamMark.countDocuments({ studentId: student._id });
  if (examCount === 0) {
    const examMarks = [
      {
        studentId: student._id,
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Operating Systems",
        examType: "Mid Term 1",
        maxMarks: 100,
        marksObtained: 94,
        grade: "A+",
        evaluatedBy: teacher._id,
        remarks: "Exemplary understanding of kernel concurrency and semaphores."
      },
      {
        studentId: student._id,
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Computer Networks",
        examType: "Mid Term 1",
        maxMarks: 100,
        marksObtained: 88,
        grade: "A",
        evaluatedBy: teacher._id,
        remarks: "Solid grasp of TCP/IP protocol stack and subnet routing."
      },
      {
        studentId: student._id,
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Database Management Systems",
        examType: "Mid Term 1",
        maxMarks: 100,
        marksObtained: 91,
        grade: "A+",
        evaluatedBy: teacher._id,
        remarks: "Excellent query optimization and B-Tree indexing explanations."
      },
      {
        studentId: student._id,
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Cloud Computing",
        examType: "Mid Term 1",
        maxMarks: 100,
        marksObtained: 85,
        grade: "A",
        evaluatedBy: teacher._id,
        remarks: "Proficient containerization architecture designs."
      },
      {
        studentId: student._id,
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Software Engineering",
        examType: "Mid Term 1",
        maxMarks: 100,
        marksObtained: 79,
        grade: "B+",
        evaluatedBy: teacher._id,
        remarks: "Good architectural diagrams and agile workflow definitions."
      }
    ];

    await ExamMark.insertMany(examMarks);
    console.log(`[Seed] Seeded ${examMarks.length} examination records.`);
  }

  // ==========================================
  // 4. SEED ASSIGNMENTS
  // ==========================================
  const assignmentCount = await Assignment.countDocuments({ branch: "CSE" });
  if (assignmentCount === 0) {
    const due1 = new Date();
    due1.setDate(due1.getDate() + 5);

    const due2 = new Date();
    due2.setDate(due2.getDate() + 10);

    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 3);

    const assignments = [
      {
        title: "OS Lab: Implementing Multi-threaded Producer-Consumer with POSIX Semaphores",
        description: "Develop a C program running in Linux that implements bounded-buffer synchronization using pthread mutexes and semaphores.",
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Operating Systems",
        dueDate: due1,
        totalPoints: 50,
        createdBy: teacher._id,
        submissions: [
          {
            studentId: student._id,
            submittedAt: new Date(),
            submissionText: "Submitted POSIX semaphore implementation with deadlock avoidance verified.",
            status: "submitted"
          }
        ]
      },
      {
        title: "Network Socket Programming: TCP Client-Server Chat Architecture",
        description: "Build an asynchronous socket server in Node.js or Python supporting multiple concurrent client sessions.",
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Computer Networks",
        dueDate: due2,
        totalPoints: 100,
        createdBy: teacher._id,
        submissions: []
      },
      {
        title: "Relational Schema Normalization & Complex Analytical SQL Queries",
        description: "Submit 3NF and BCNF normalization proofs and write window function queries over polytechnic student datasets.",
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        subject: "Database Management Systems",
        dueDate: pastDue,
        totalPoints: 50,
        createdBy: teacher._id,
        submissions: [
          {
            studentId: student._id,
            submittedAt: pastDue,
            submissionText: "Completed all 10 analytical SQL queries and schema decomposition proofs.",
            status: "evaluated",
            grade: 48,
            feedback: "Outstanding relational integrity proofs."
          }
        ]
      }
    ];

    await Assignment.insertMany(assignments);
    console.log(`[Seed] Seeded ${assignments.length} assignments.`);
  }

  // ==========================================
  // 5. SEED TIMETABLE SLOTS
  // ==========================================
  const timetableCount = await Timetable.countDocuments({ branch: "CSE" });
  if (timetableCount === 0) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timetableDocs = days.map((day) => ({
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      dayOfWeek: day,
      slots: [
        {
          startTime: "09:30 AM",
          endTime: "10:30 AM",
          subject: "Operating Systems",
          teacherId: teacher._id,
          teacherName: teacher.fullName,
          roomNo: "Room 302",
          type: "Lecture"
        },
        {
          startTime: "10:30 AM",
          endTime: "11:30 AM",
          subject: "Computer Networks",
          teacherId: teacher._id,
          teacherName: teacher.fullName,
          roomNo: "Room 302",
          type: "Lecture"
        },
        {
          startTime: "11:45 AM",
          endTime: "01:15 PM",
          subject: "Advanced Unix & Cloud Lab",
          teacherId: teacher._id,
          teacherName: teacher.fullName,
          roomNo: "Linux Lab 2",
          type: "Lab"
        },
        {
          startTime: "02:00 PM",
          endTime: "03:00 PM",
          subject: "Database Management Systems",
          teacherId: teacher._id,
          teacherName: teacher.fullName,
          roomNo: "Room 302",
          type: "Lecture"
        },
        {
          startTime: "03:00 PM",
          endTime: "04:00 PM",
          subject: "Technical Project Mentorship",
          teacherId: coordinator._id,
          teacherName: coordinator.fullName,
          roomNo: "Seminar Hall B",
          type: "Tutorial"
        }
      ]
    }));

    await Timetable.insertMany(timetableDocs);
    console.log(`[Seed] Seeded weekly timetables for CSE Semester 5.`);
  }

  // ==========================================
  // 6. SEED NOTICES & ANNOUNCEMENTS
  // ==========================================
  const noticeCount = await Notice.countDocuments();
  if (noticeCount === 0) {
    const notices = [
      {
        title: "Polytechnic Mid-Term Examination Schedule — Autumn 2026",
        content: "Mid-Term Examinations for 2nd and 3rd year diploma students commence from 15th November 2026. Detailed seating arrangements and admit card releases will follow on CollegeOS.",
        category: "Examination",
        targetRoles: ["student", "teacher", "hod", "coordinator"],
        targetBranches: ["ALL"],
        priority: "urgent",
        publishedBy: principal._id,
        publishedByName: principal.fullName,
        publishedByRole: "principal",
        isPinned: true
      },
      {
        title: "Campus Placement Drive: Tata Consultancy Services & Havells India",
        content: "Final year diploma candidates in CSE, Electrical, and Mechanical engineering are invited for on-campus technical interviews on 22nd November. Ensure student profiles and ledgers are 100% updated.",
        category: "Placement",
        targetRoles: ["student", "teacher", "coordinator"],
        targetBranches: ["CSE", "Electrical", "Mechanical"],
        priority: "important",
        publishedBy: coordinator._id,
        publishedByName: coordinator.fullName,
        publishedByRole: "coordinator",
        isPinned: true
      },
      {
        title: "Subharti Innovation & Robotics Hackathon 2026 Registration Open",
        content: "Annual institutional hackathon with cash awards and incubation mentorship. Inter-department teams of 3 to 4 candidates are eligible to participate.",
        category: "Academic",
        targetRoles: ["student", "teacher"],
        targetBranches: ["ALL"],
        priority: "normal",
        publishedBy: hod._id,
        publishedByName: hod.fullName,
        publishedByRole: "hod",
        isPinned: false
      }
    ];

    await Notice.insertMany(notices);
    console.log(`[Seed] Seeded ${notices.length} notices.`);
  }

  // ==========================================
  // 7. SEED LEAVE APPLICATIONS
  // ==========================================
  const leaveCount = await LeaveApplication.countDocuments();
  if (leaveCount === 0) {
    const start1 = new Date();
    start1.setDate(start1.getDate() + 2);
    const end1 = new Date();
    end1.setDate(end1.getDate() + 4);

    const start2 = new Date();
    start2.setDate(start2.getDate() - 10);
    const end2 = new Date();
    end2.setDate(end2.getDate() - 8);

    const leaves = [
      {
        applicantId: student._id,
        applicantRole: "student",
        applicantName: student.fullName,
        department: "CSE",
        leaveType: "Medical",
        startDate: start1,
        endDate: end1,
        reason: "Medical leave for dental surgery and post-op recovery.",
        status: "pending"
      },
      {
        applicantId: student._id,
        applicantRole: "student",
        applicantName: student.fullName,
        department: "CSE",
        leaveType: "Academic / Duty",
        startDate: start2,
        endDate: end2,
        reason: "Represented Subharti Polytechnic at Regional Hackathon.",
        status: "approved",
        reviewedBy: hod._id,
        reviewerRemarks: "Sanctioned on institutional duty merit."
      },
      {
        applicantId: teacher._id,
        applicantRole: "teacher",
        applicantName: teacher.fullName,
        department: "CSE",
        leaveType: "Casual",
        startDate: start1,
        endDate: start1,
        reason: "Attending IEEE Workshop on Cloud Computing as keynote speaker.",
        status: "pending"
      }
    ];

    await LeaveApplication.insertMany(leaves);
    console.log(`[Seed] Seeded ${leaves.length} leave applications.`);
  }

  // ==========================================
  // 8. SEED NOTIFICATIONS
  // ==========================================
  const notifCount = await Notification.countDocuments();
  if (notifCount === 0) {
    const notifications = [
      {
        recipientId: student._id,
        title: "Assignment Graded: Database Management Systems",
        message: "Dr. Sunita Deshpande awarded 48/50 on your Relational Schema assignment.",
        type: "success",
        link: "#/dashboard/assignments",
        isRead: false
      },
      {
        recipientId: student._id,
        title: "Attendance Milestone Achieved",
        message: "Your overall attendance is currently 92%, well above the 75% examination threshold.",
        type: "info",
        link: "#/dashboard/attendance",
        isRead: false
      },
      {
        recipientId: teacher._id,
        title: "Pending Assignment Submissions",
        message: "12 students submitted their OS Producer-Consumer Lab code for review.",
        type: "warning",
        link: "#/dashboard/assignments",
        isRead: false
      },
      {
        recipientRole: "hod",
        title: "Leave Approval Request Pending",
        message: "Dr. Sunita Deshpande submitted a casual leave request for review.",
        type: "alert",
        link: "#/dashboard/leaves",
        isRead: false
      }
    ];

    await Notification.insertMany(notifications);
    console.log(`[Seed] Seeded ${notifications.length} notifications.`);
  }

  console.log("[Seed] Institutional data seeding successfully verified.");
}

// Allow direct CLI execution: node src/utils/seed.js
if (process.argv[1]?.includes("seed.js")) {
  seedInitialData()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("[Seed Error]", err);
      await disconnectDB();
      process.exit(1);
    });
}
