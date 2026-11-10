import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import StudentProfile from "../src/models/StudentProfile.js";
import TeacherProfile from "../src/models/TeacherProfile.js";
import HODProfile from "../src/models/HODProfile.js";
import PrincipalProfile from "../src/models/PrincipalProfile.js";
import Attendance from "../src/models/Attendance.js";
import ExamMark from "../src/models/ExamMark.js";
import Assignment from "../src/models/Assignment.js";
import Notice from "../src/models/Notice.js";
import LeaveApplication from "../src/models/LeaveApplication.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("CollegeOS Premium Role-Based Dashboard & Academic Integration Test Suite", () => {
  let studentToken = "";
  let studentId = "";
  let teacherToken = "";
  let teacherId = "";
  let hodToken = "";
  let principalToken = "";
  let adminToken = "";
  let testAssignmentId = "";
  let testLeaveId = "";

  before(async () => {
    await connectDB();

    // Clean test DB collections
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});
    await HODProfile.deleteMany({});
    await PrincipalProfile.deleteMany({});
    await Attendance.deleteMany({});
    await ExamMark.deleteMany({});
    await Assignment.deleteMany({});
    await Notice.deleteMany({});
    await LeaveApplication.deleteMany({});

    // 1. Create Student
    const studentHash = await User.hashPassword("Student@123");
    const studentUser = await User.create({
      fullName: "Ananya Verma",
      email: "ananya.student@subharti.org",
      passwordHash: studentHash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });
    studentId = studentUser._id.toString();

    await StudentProfile.create({
      userId: studentUser._id,
      branch: "CSE",
      academicYear: "2nd Year",
      semester: "Semester 3",
      enrollmentNo: "SVSU/2025/CSE/088",
      attendancePercentage: 90
    });

    const sLogin = await request(app).post("/api/auth/login").send({
      email: "ananya.student@subharti.org",
      password: "Student@123"
    });
    studentToken = sLogin.body.token;

    // 2. Create Teacher
    const teacherHash = await User.hashPassword("Teacher@123");
    const teacherUser = await User.create({
      fullName: "Dr. Alok Nath",
      email: "alok.teacher@subharti.org",
      passwordHash: teacherHash,
      role: "teacher",
      status: "verified",
      isEmailVerified: true
    });
    teacherId = teacherUser._id.toString();

    await TeacherProfile.create({
      userId: teacherUser._id,
      department: "CSE",
      employeeId: "EMP-CSE-404",
      designation: "Assistant Professor",
      subjects: ["Data Structures", "Algorithms"]
    });

    const tLogin = await request(app).post("/api/auth/login").send({
      email: "alok.teacher@subharti.org",
      password: "Teacher@123"
    });
    teacherToken = tLogin.body.token;

    // 3. Create HOD
    const hodHash = await User.hashPassword("Hod@123");
    const hodUser = await User.create({
      fullName: "Prof. Neeraj Gupta",
      email: "neeraj.hod@subharti.org",
      passwordHash: hodHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });

    await HODProfile.create({
      userId: hodUser._id,
      department: "CSE",
      employeeId: "HOD-CSE-001"
    });

    const hLogin = await request(app).post("/api/auth/login").send({
      email: "neeraj.hod@subharti.org",
      password: "Hod@123"
    });
    hodToken = hLogin.body.token;

    // 4. Create Principal
    const princHash = await User.hashPassword("Principal@123");
    const princUser = await User.create({
      fullName: "Dr. Virendra Saxena",
      email: "virendra.principal@subharti.org",
      passwordHash: princHash,
      role: "principal",
      status: "verified",
      isEmailVerified: true
    });

    await PrincipalProfile.create({
      userId: princUser._id,
      employeeId: "DIR-SVSU-001"
    });

    const pLogin = await request(app).post("/api/auth/login").send({
      email: "virendra.principal@subharti.org",
      password: "Principal@123"
    });
    principalToken = pLogin.body.token;

    // 5. Create Admin
    const adminHash = await User.hashPassword("Admin@123");
    await User.create({
      fullName: "Admin Controller",
      email: "admin.core@subharti.org",
      passwordHash: adminHash,
      role: "admin",
      status: "verified",
      isEmailVerified: true
    });

    const aLogin = await request(app).post("/api/auth/login").send({
      email: "admin.core@subharti.org",
      password: "Admin@123"
    });
    adminToken = aLogin.body.token;

    // Seed some initial attendance and marks for student
    await Attendance.create({
      studentId: studentUser._id,
      branch: "CSE",
      academicYear: "2nd Year",
      semester: "Semester 3",
      subject: "Data Structures",
      date: new Date(),
      status: "present",
      markedBy: teacherUser._id
    });

    await ExamMark.create({
      studentId: studentUser._id,
      branch: "CSE",
      academicYear: "2nd Year",
      semester: "Semester 3",
      subject: "Data Structures",
      examType: "Mid Term 1",
      maxMarks: 100,
      marksObtained: 89,
      grade: "A",
      evaluatedBy: teacherUser._id
    });

    // Create a test assignment
    const asgn = await Assignment.create({
      title: "Binary Trees & AVL Balancing",
      description: "Implement self-balancing AVL rotation routines.",
      branch: "CSE",
      academicYear: "2nd Year",
      semester: "Semester 3",
      subject: "Data Structures",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: teacherUser._id
    });
    testAssignmentId = asgn._id.toString();
  });

  after(async () => {
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await Attendance.deleteMany({});
    await ExamMark.deleteMany({});
    await Assignment.deleteMany({});
    await Notice.deleteMany({});
    await LeaveApplication.deleteMany({});
    await disconnectDB();
  });

  // ==========================================
  // 1. Role-Tailored Dashboard Stats
  // ==========================================
  describe("GET /api/dashboard/stats", () => {
    test("should reject unauthenticated request with HTTP 401", async () => {
      const res = await request(app).get("/api/dashboard/stats");
      assert.equal(res.status, 401);
    });

    test("Student receives student-tailored KPI summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "student");
      assert.ok(res.body.summary);
      assert.equal(res.body.summary.branch, "CSE");
      assert.equal(res.body.summary.enrollmentNo, "SVSU/2025/CSE/088");
      assert.ok(res.body.summary.attendancePercentage !== undefined);
      assert.ok(Array.isArray(res.body.subjectAttendance));
    });

    test("Teacher receives faculty-tailored KPI summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "teacher");
      assert.ok(res.body.summary.assignedStudentsCount !== undefined);
      assert.ok(Array.isArray(res.body.subjects));
    });

    test("HOD receives department-tailored KPI summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${hodToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "hod");
      assert.equal(res.body.summary.department, "CSE");
      assert.ok(res.body.summary.deptStudentCount !== undefined);
      assert.ok(res.body.summary.deptTeacherCount !== undefined);
    });

    test("Principal receives institutional-wide KPI summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${principalToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "principal");
      assert.ok(res.body.summary.totalStudents !== undefined);
      assert.ok(res.body.summary.totalFaculty !== undefined);
      assert.ok(res.body.summary.institutionAttendanceAvg !== undefined);
    });

    test("Admin receives system management summary", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.role, "admin");
      assert.ok(res.body.summary.totalUsers !== undefined);
      assert.ok(res.body.systemStatus);
    });
  });

  // ==========================================
  // 2. Real Dashboard Charts
  // ==========================================
  describe("GET /api/dashboard/charts", () => {
    test("Student receives verified attendance trend & marks charts", async () => {
      const res = await request(app)
        .get("/api/dashboard/charts")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.charts.attendanceTrend);
      assert.ok(res.body.charts.marksDistribution);
    });

    test("Teacher receives class attendance & assignment progress charts", async () => {
      const res = await request(app)
        .get("/api/dashboard/charts")
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.charts.classAttendanceData);
      assert.ok(res.body.charts.assignmentProgress);
    });

    test("HOD receives grade distribution charts", async () => {
      const res = await request(app)
        .get("/api/dashboard/charts")
        .set("Authorization", `Bearer ${hodToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.charts.gradeDistribution);
    });
  });

  // ==========================================
  // 3. Role-Based Access Control & Operations
  // ==========================================
  describe("Academic Operations & RBAC Data Isolation", () => {
    test("Student cannot mark attendance (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/academic/attendance")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          records: [{ studentId, status: "present" }]
        });

      assert.equal(res.status, 403);
    });

    test("Teacher can mark attendance successfully", async () => {
      const res = await request(app)
        .post("/api/academic/attendance")
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({
          records: [{ studentId, status: "present", subject: "Algorithms" }],
          branch: "CSE",
          academicYear: "2nd Year",
          semester: "Semester 3",
          subject: "Algorithms"
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test("Student can query own attendance but cannot see unpermitted students", async () => {
      const res = await request(app)
        .get("/api/academic/attendance")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      // All returned records must belong to student
      res.body.records.forEach((r) => {
        const sid = r.studentId?._id?.toString() || r.studentId?.toString() || r.studentId?.id;
        assert.equal(sid, studentId);
      });
    });

    test("Student can submit assignment solution", async () => {
      const res = await request(app)
        .post(`/api/academic/assignments/${testAssignmentId}/submit`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          submissionText: "Completed AVL balancing rotations with left-right cases verified."
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test("Teacher can grade student submission", async () => {
      const res = await request(app)
        .patch(`/api/academic/assignments/${testAssignmentId}/grade`)
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({
          studentId,
          grade: 95,
          feedback: "Flawless rotation implementations."
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test("Student can submit leave application", async () => {
      const res = await request(app)
        .post("/api/academic/leaves")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          leaveType: "Medical",
          startDate: new Date(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          reason: "Viral fever and physician recommended rest."
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.leave);
      testLeaveId = res.body.leave.id || res.body.leave._id;
    });

    test("Student cannot approve or reject leaves (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/academic/leaves/${testLeaveId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "approved" });

      assert.equal(res.status, 403);
    });

    test("HOD can approve leave request", async () => {
      const res = await request(app)
        .patch(`/api/academic/leaves/${testLeaveId}/status`)
        .set("Authorization", `Bearer ${hodToken}`)
        .send({ status: "approved", remarks: "Sanctioned on medical grounds." });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.leave.status, "approved");
    });

    test("Student cannot access Admin User Management (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/academic/management/users")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 403);
    });

    test("Admin can access User Management and list accounts", async () => {
      const res = await request(app)
        .get("/api/academic/management/users")
        .set("Authorization", `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.users));
      assert.ok(res.body.users.length > 0);
    });

    // Course Materials & Video Lectures
    let createdMaterialId = "";

    test("Student cannot publish course materials (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/academic/materials")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Cheatsheet on OS",
          branch: "CSE",
          semester: "Semester 3",
          subject: "Operating Systems"
        });

      assert.equal(res.status, 403);
    });

    test("Teacher can publish course notes and lecture video links", async () => {
      const res = await request(app)
        .post("/api/academic/materials")
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({
          title: "Lecture 5: Binary Search Trees & AVL Rotations",
          description: "Full slide deck and whiteboard walkthrough video.",
          type: "video",
          branch: "CSE",
          academicYear: "2nd Year",
          semester: "Semester 3",
          subject: "Data Structures",
          videoUrl: "https://www.youtube.com/watch?v=sample_svsu"
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.material.title, "Lecture 5: Binary Search Trees & AVL Rotations");
      createdMaterialId = res.body.material.id;
    });

    test("Student can query course materials for their branch & semester", async () => {
      const res = await request(app)
        .get("/api/academic/materials")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.materials));
      const found = res.body.materials.find((m) => m.id === createdMaterialId);
      assert.ok(found);
    });

    test("Student cannot delete course materials (HTTP 403 Forbidden)", async () => {
      const res = await request(app)
        .delete(`/api/academic/materials/${createdMaterialId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 403);
    });

    test("Teacher can delete their own published course materials", async () => {
      const res = await request(app)
        .delete(`/api/academic/materials/${createdMaterialId}`)
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });
});
