import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import StudentProfile from "../src/models/StudentProfile.js";
import TeacherProfile from "../src/models/TeacherProfile.js";
import HODProfile from "../src/models/HODProfile.js";
import Attendance from "../src/models/Attendance.js";
import ExamMark from "../src/models/ExamMark.js";
import Timetable from "../src/models/Timetable.js";
import Notice from "../src/models/Notice.js";
import LeaveApplication from "../src/models/LeaveApplication.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_hod_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("HOD Dashboard V3 & Department Isolation Test Suite", () => {
  let cseHodToken = "";
  let cseHodUser = null;
  let mechHodToken = "";
  let mechHodUser = null;

  let cseStudentUser = null;
  let mechStudentUser = null;
  let cseTeacherUser = null;

  let cseLeaveId = "";
  let mechLeaveId = "";

  before(async () => {
    await connectDB();

    // Clean test DB
    await User.deleteMany({ email: /@test-hodv3\.org$/ });
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});
    await HODProfile.deleteMany({});
    await Attendance.deleteMany({});
    await ExamMark.deleteMany({});
    await Timetable.deleteMany({});
    await Notice.deleteMany({});
    await LeaveApplication.deleteMany({});

    const pwdHash = await User.hashPassword("Hod@12345");

    // 1. CSE HOD
    cseHodUser = await User.create({
      fullName: "Dr. Rajesh K. Sharma",
      email: "hod.cse@test-hodv3.org",
      passwordHash: pwdHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });
    await HODProfile.create({
      userId: cseHodUser._id,
      department: "Computer Science & Engineering",
      employeeId: "EMP-CSE-001",
      approvalStatus: "approved"
    });

    // 2. Mechanical HOD
    mechHodUser = await User.create({
      fullName: "Prof. Vikram Malhotra",
      email: "hod.mech@test-hodv3.org",
      passwordHash: pwdHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });
    await HODProfile.create({
      userId: mechHodUser._id,
      department: "Mechanical Engineering",
      employeeId: "EMP-MECH-001",
      approvalStatus: "approved"
    });

    // 3. CSE Student
    cseStudentUser = await User.create({
      fullName: "Aarav Patel",
      email: "aarav.cse@test-hodv3.org",
      passwordHash: pwdHash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });
    await StudentProfile.create({
      userId: cseStudentUser._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      enrollmentNo: "CSE2026001",
      rollNo: "21",
      attendancePercentage: 80
    });

    // 4. Mechanical Student
    mechStudentUser = await User.create({
      fullName: "Rohan Verma",
      email: "rohan.mech@test-hodv3.org",
      passwordHash: pwdHash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });
    await StudentProfile.create({
      userId: mechStudentUser._id,
      branch: "Mechanical",
      academicYear: "2nd Year",
      semester: "Semester 3",
      enrollmentNo: "MEC2026001",
      rollNo: "12",
      attendancePercentage: 70
    });

    // 5. CSE Teacher
    cseTeacherUser = await User.create({
      fullName: "Dr. Sunita Deshpande",
      email: "sunita.cse@test-hodv3.org",
      passwordHash: pwdHash,
      role: "teacher",
      status: "verified",
      isEmailVerified: true
    });
    await TeacherProfile.create({
      userId: cseTeacherUser._id,
      department: "CSE",
      designation: "Associate Professor",
      employeeId: "FAC-CSE-004",
      approvalStatus: "approved",
      subjects: ["Operating Systems", "Cloud Computing"]
    });

    // 6. Seed Attendance
    await Attendance.create({
      studentId: cseStudentUser._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      subject: "Operating Systems",
      date: new Date(),
      status: "present",
      markedBy: cseTeacherUser._id
    });
    await Attendance.create({
      studentId: cseStudentUser._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      subject: "Cloud Computing",
      date: new Date(),
      status: "late",
      markedBy: cseTeacherUser._id
    });
    await Attendance.create({
      studentId: mechStudentUser._id,
      branch: "Mechanical",
      academicYear: "2nd Year",
      semester: "Semester 3",
      subject: "Thermodynamics",
      date: new Date(),
      status: "absent",
      markedBy: cseTeacherUser._id
    });

    // 7. Seed Exam Marks
    await ExamMark.create({
      studentId: cseStudentUser._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      subject: "Operating Systems",
      examType: "Mid Term 1",
      maxMarks: 100,
      marksObtained: 85,
      grade: "A",
      evaluatedBy: cseTeacherUser._id
    });
    await ExamMark.create({
      studentId: mechStudentUser._id,
      branch: "Mechanical",
      academicYear: "2nd Year",
      semester: "Semester 3",
      subject: "Thermodynamics",
      examType: "Mid Term 1",
      maxMarks: 100,
      marksObtained: 45,
      grade: "C",
      evaluatedBy: cseTeacherUser._id
    });

    // 8. Seed Timetable
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];
    await Timetable.create({
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      dayOfWeek: todayName,
      slots: [
        {
          startTime: "09:00 AM",
          endTime: "10:00 AM",
          subject: "Operating Systems",
          teacherId: cseTeacherUser._id,
          teacherName: cseTeacherUser.fullName,
          roomNo: "Lab 201",
          type: "Lab"
        }
      ]
    });

    // 9. Seed Leaves for both departments
    const cseLeave = await LeaveApplication.create({
      applicantId: cseStudentUser._id,
      applicantRole: "student",
      applicantName: cseStudentUser.fullName,
      department: "CSE",
      leaveType: "Medical",
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reason: "Viral fever and rest advised by medical doctor",
      status: "pending"
    });
    cseLeaveId = cseLeave._id.toString();

    const mechLeave = await LeaveApplication.create({
      applicantId: mechStudentUser._id,
      applicantRole: "student",
      applicantName: mechStudentUser.fullName,
      department: "Mechanical",
      leaveType: "Personal",
      startDate: new Date(),
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      reason: "Family function out of town",
      status: "pending"
    });
    mechLeaveId = mechLeave._id.toString();

    // Logins
    const cseLogin = await request(app).post("/api/auth/login").send({
      email: "hod.cse@test-hodv3.org",
      password: "Hod@12345"
    });
    cseHodToken = cseLogin.body.token;

    const mechLogin = await request(app).post("/api/auth/login").send({
      email: "hod.mech@test-hodv3.org",
      password: "Hod@12345"
    });
    mechHodToken = mechLogin.body.token;
  });

  after(async () => {
    await User.deleteMany({ email: /@test-hodv3\.org$/ });
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});
    await HODProfile.deleteMany({});
    await Attendance.deleteMany({});
    await ExamMark.deleteMany({});
    await Timetable.deleteMany({});
    await LeaveApplication.deleteMany({});
    await disconnectDB();
  });

  // ==========================================
  // 1. Department Isolation in Dashboard Stats
  // ==========================================
  describe("Department Isolation: GET /api/dashboard/stats", () => {
    test("CSE HOD only receives CSE metrics and students", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${cseHodToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "hod");
      assert.equal(res.body.summary.department, "Computer Science & Engineering");

      // Exactly 1 CSE student seeded
      assert.equal(res.body.summary.deptStudentCount, 1);
      // Exactly 1 CSE faculty seeded
      assert.equal(res.body.summary.deptTeacherCount, 1);
      // Both CSE attendance records were present/late -> 100%
      assert.equal(res.body.summary.deptAttendanceAvg, 100);
      // CSE exam marks was 85/100 -> 85%
      assert.equal(res.body.summary.deptAvgExamScore, 85);
      // CSE leave only
      assert.equal(res.body.pendingLeaves.length, 1);
      assert.equal(res.body.pendingLeaves[0].id, cseLeaveId);
    });

    test("Mechanical HOD only receives Mechanical metrics and students", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${mechHodToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.summary.department, "Mechanical Engineering");
      // Exactly 1 Mechanical student
      assert.equal(res.body.summary.deptStudentCount, 1);
      // 0 Mechanical faculty
      assert.equal(res.body.summary.deptTeacherCount, 0);
      // Mechanical student attendance was absent -> 0%
      assert.equal(res.body.summary.deptAttendanceAvg, 0);
      // Mechanical leave only
      assert.equal(res.body.pendingLeaves.length, 1);
      assert.equal(res.body.pendingLeaves[0].id, mechLeaveId);
    });
  });

  // ==========================================
  // 2. Department-Isolated Leave Approvals
  // ==========================================
  describe("Cross-Department Authorization: PATCH /api/academic/leaves/:id/status", () => {
    test("CSE HOD CAN approve CSE leave", async () => {
      const res = await request(app)
        .patch(`/api/academic/leaves/${cseLeaveId}/status`)
        .set("Authorization", `Bearer ${cseHodToken}`)
        .send({ status: "approved", remarks: "Approved by CSE HOD" });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.leave.status, "approved");
    });

    test("CSE HOD CANNOT approve Mechanical leave (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/academic/leaves/${mechLeaveId}/status`)
        .set("Authorization", `Bearer ${cseHodToken}`)
        .send({ status: "approved", remarks: "Unauthorized cross-department attempt" });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Forbidden.*department/i);
    });

    test("Rejecting with invalid status returns HTTP 400", async () => {
      const res = await request(app)
        .patch(`/api/academic/leaves/${mechLeaveId}/status`)
        .set("Authorization", `Bearer ${mechHodToken}`)
        .send({ status: "invalid_status" });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test("Non-existent leave ID returns HTTP 404", async () => {
      const res = await request(app)
        .patch("/api/academic/leaves/666666666666666666666666/status")
        .set("Authorization", `Bearer ${mechHodToken}`)
        .send({ status: "approved" });

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });

  // ==========================================
  // 3. Department-Isolated Charts
  // ==========================================
  describe("Department Charts: GET /api/dashboard/charts", () => {
    test("CSE HOD charts aggregate only CSE records", async () => {
      const res = await request(app)
        .get("/api/dashboard/charts")
        .set("Authorization", `Bearer ${cseHodToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.charts);

      // Grade distribution contains CSE grade 'A' (1 count)
      const gradeA = res.body.charts.gradeDistribution.find((g) => g.grade === "A");
      assert.equal(gradeA.count, 1);

      // Subject performance contains 'Operating Systems' with 85%
      const osPerf = res.body.charts.subjectPerformance.find((s) => s.subject === "Operating Systems");
      assert.ok(osPerf);
      assert.equal(osPerf.percentage, 85);
    });
  });
});
