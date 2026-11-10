import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import StudentProfile from "../src/models/StudentProfile.js";
import Attendance from "../src/models/Attendance.js";
import ExamMark from "../src/models/ExamMark.js";
import LeaveApplication from "../src/models/LeaveApplication.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("CollegeOS Student Directory & Security Permissions Test Suite", () => {
  let student1Token = "";
  let student1Id = "";
  let student2Token = "";
  let student2Id = "";
  let teacherToken = "";
  let teacherId = "";
  let hodToken = "";
  let coordinatorToken = "";
  let principalToken = "";
  let adminToken = "";

  before(async () => {
    await connectDB();

    // Clean test DB
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await Attendance.deleteMany({});
    await ExamMark.deleteMany({});
    await LeaveApplication.deleteMany({});

    // 1. Student 1 (Aarav - CSE)
    const s1Hash = await User.hashPassword("Student@123");
    const s1 = await User.create({
      fullName: "Aarav Sharma",
      email: "aarav.student@subharti.org",
      passwordHash: s1Hash,
      role: "student",
      status: "verified",
      isEmailVerified: true,
      phone: "+91 9876543210"
    });
    student1Id = s1._id.toString();

    await StudentProfile.create({
      userId: s1._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      enrollmentNo: "SVSU/2024/CSE/012",
      attendancePercentage: 88,
      skills: ["React", "Node.js", "Python"],
      bio: "Aspiring Cloud Architect and Diploma Candidate."
    });

    const s1Login = await request(app).post("/api/auth/login").send({
      email: "aarav.student@subharti.org",
      password: "Student@123"
    });
    student1Token = s1Login.body.token;

    // Add private academic records for Student 1
    await Attendance.create({
      studentId: s1._id,
      subject: "Operating Systems",
      branch: "CSE",
      semester: "Semester 5",
      academicYear: "3rd Year",
      date: new Date(),
      status: "present",
      markedBy: s1._id
    });

    await ExamMark.create({
      studentId: s1._id,
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      subject: "Operating Systems",
      examType: "Mid Term 1",
      marksObtained: 45,
      maxMarks: 50,
      grade: "A+",
      evaluatedBy: s1._id
    });

    await LeaveApplication.create({
      applicantId: s1._id,
      applicantRole: "student",
      applicantName: "Aarav Sharma",
      leaveType: "Medical",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-03"),
      reason: "Viral fever - confidential health reason",
      status: "approved"
    });

    // 2. Student 2 (Bhavna - ECE)
    const s2Hash = await User.hashPassword("Student@123");
    const s2 = await User.create({
      fullName: "Bhavna Patel",
      email: "bhavna.student@subharti.org",
      passwordHash: s2Hash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });
    student2Id = s2._id.toString();

    await StudentProfile.create({
      userId: s2._id,
      branch: "ECE",
      academicYear: "2nd Year",
      semester: "Semester 3",
      enrollmentNo: "SVSU/2025/ECE/045",
      attendancePercentage: 92,
      skills: ["Embedded C", "MATLAB"],
      bio: "Diploma candidate in ECE."
    });

    const s2Login = await request(app).post("/api/auth/login").send({
      email: "bhavna.student@subharti.org",
      password: "Student@123"
    });
    student2Token = s2Login.body.token;

    // 3. Teacher
    const tHash = await User.hashPassword("Teacher@123");
    const t = await User.create({
      fullName: "Er. Ramesh Verma",
      email: "ramesh.teacher@subharti.org",
      passwordHash: tHash,
      role: "teacher",
      status: "verified",
      isEmailVerified: true
    });
    teacherId = t._id.toString();
    const tLogin = await request(app).post("/api/auth/login").send({
      email: "ramesh.teacher@subharti.org",
      password: "Teacher@123"
    });
    teacherToken = tLogin.body.token;

    // 4. HOD
    const hHash = await User.hashPassword("Hod@123");
    await User.create({
      fullName: "Dr. Sunita Rao",
      email: "sunita.hod@subharti.org",
      passwordHash: hHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });
    const hLogin = await request(app).post("/api/auth/login").send({
      email: "sunita.hod@subharti.org",
      password: "Hod@123"
    });
    hodToken = hLogin.body.token;

    // 5. Coordinator
    const cHash = await User.hashPassword("Coord@123");
    await User.create({
      fullName: "Prof. Vikas Gupta",
      email: "vikas.coord@subharti.org",
      passwordHash: cHash,
      role: "coordinator",
      status: "verified",
      isEmailVerified: true
    });
    const cLogin = await request(app).post("/api/auth/login").send({
      email: "vikas.coord@subharti.org",
      password: "Coord@123"
    });
    coordinatorToken = cLogin.body.token;

    // 6. Principal
    const pHash = await User.hashPassword("Principal@123");
    await User.create({
      fullName: "Dr. Mahendra Singh",
      email: "principal@subharti.org",
      passwordHash: pHash,
      role: "principal",
      status: "verified",
      isEmailVerified: true
    });
    const pLogin = await request(app).post("/api/auth/login").send({
      email: "principal@subharti.org",
      password: "Principal@123"
    });
    principalToken = pLogin.body.token;

    // 7. Admin
    const aHash = await User.hashPassword("Admin@123");
    await User.create({
      fullName: "System Admin",
      email: "admin@subharti.org",
      passwordHash: aHash,
      role: "admin",
      status: "verified",
      isEmailVerified: true
    });
    const aLogin = await request(app).post("/api/auth/login").send({
      email: "admin@subharti.org",
      password: "Admin@123"
    });
    adminToken = aLogin.body.token;
  });

  after(async () => {
    await disconnectDB();
  });

  // ============================================================
  //  DIRECTORY LISTING & SEARCH / FILTER (All Roles Access)
  // ============================================================

  test("1. Unauthenticated request to /api/students is rejected with 401", async () => {
    const res = await request(app).get("/api/students");
    assert.equal(res.status, 401);
  });

  test("2. Student can access GET /api/students directory", async () => {
    const res = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.students));
    assert.ok(res.body.students.length >= 2);
  });

  test("3. Student role receives public projection only (no phone/email of other students)", async () => {
    const res = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${student2Token}`);

    assert.equal(res.status, 200);
    const aaravCard = res.body.students.find((s) => s.id === student1Id);
    assert.ok(aaravCard);
    assert.equal(aaravCard.fullName, "Aarav Sharma");
    assert.equal(aaravCard.branch, "CSE");
    // Phone must NOT be exposed to student caller
    assert.equal(aaravCard.phone, undefined);
    // Private attendance percentage on directory card must NOT be exposed to student
    assert.equal(aaravCard.attendancePercentage, undefined);
  });

  test("4. Staff role (Teacher) sees contact info in directory cards", async () => {
    const res = await request(app)
      .get("/api/students")
      .set("Authorization", `Bearer ${teacherToken}`);

    assert.equal(res.status, 200);
    const aaravCard = res.body.students.find((s) => s.id === student1Id);
    assert.ok(aaravCard);
    assert.equal(aaravCard.email, "aarav.student@subharti.org");
    assert.equal(aaravCard.phone, "+91 9876543210");
  });

  test("5. Directory search filters by student name", async () => {
    const res = await request(app)
      .get("/api/students?search=Bhavna")
      .set("Authorization", `Bearer ${principalToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.students.length, 1);
    assert.equal(res.body.students[0].fullName, "Bhavna Patel");
  });

  test("6. Directory filter by branch returns matching students only", async () => {
    const res = await request(app)
      .get("/api/students?branch=CSE")
      .set("Authorization", `Bearer ${hodToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.students.length >= 1);
    assert.ok(res.body.students.every((s) => s.branch === "CSE"));
  });

  // ============================================================
  //  PUBLIC PROFILE & STUDENT-TO-STUDENT ISOLATION
  // ============================================================

  test("7. Student B viewing Student A's public profile gets 200 with public info", async () => {
    const res = await request(app)
      .get(`/api/students/${student1Id}/public`)
      .set("Authorization", `Bearer ${student2Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.student.fullName, "Aarav Sharma");
    assert.equal(res.body.profile.branch, "CSE");
  });

  test("8. Student B CANNOT view Student A's private academic records (backend isolation)", async () => {
    const res = await request(app)
      .get(`/api/students/${student1Id}/public`)
      .set("Authorization", `Bearer ${student2Token}`);

    assert.equal(res.status, 200);
    // academicData must be null for non-self student caller
    assert.equal(res.body.academicData, null);
  });

  test("9. Student A viewing their OWN profile gets their own academic data and leaves", async () => {
    const res = await request(app)
      .get(`/api/students/${student1Id}/public`)
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.academicData);
    assert.ok(Array.isArray(res.body.academicData.recentAttendance));
    assert.ok(Array.isArray(res.body.academicData.examMarks));
    assert.ok(Array.isArray(res.body.academicData.leaveApplications));
    assert.equal(res.body.academicData.leaveApplications.length, 1);
  });

  test("10. Staff (Teacher) viewing Student A gets academic records but NOT confidential leave applications", async () => {
    const res = await request(app)
      .get(`/api/students/${student1Id}/public`)
      .set("Authorization", `Bearer ${teacherToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.academicData);
    assert.ok(Array.isArray(res.body.academicData.recentAttendance));
    assert.ok(Array.isArray(res.body.academicData.examMarks));
    // Leaves are confidential to the student applicant
    assert.equal(res.body.academicData.leaveApplications, undefined);
  });

  test("11. Requesting non-existent student ID returns 404", async () => {
    const fakeId = "64b1f234567890abcdef1234";
    const res = await request(app)
      .get(`/api/students/${fakeId}/public`)
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  // ============================================================
  //  DELETION / DEACTIVATION PERMISSION ENFORCEMENT
  // ============================================================

  test("12. Student cannot delete another student (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student2Id}`)
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 403);
  });

  test("13. Student cannot delete themselves (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student1Id}`)
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 403);
  });

  test("14. Teacher cannot delete student (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student1Id}`)
      .set("Authorization", `Bearer ${teacherToken}`);

    assert.equal(res.status, 403);
  });

  test("15. HOD cannot delete student (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student1Id}`)
      .set("Authorization", `Bearer ${hodToken}`);

    assert.equal(res.status, 403);
  });

  test("16. Coordinator cannot delete student (403 Forbidden)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student1Id}`)
      .set("Authorization", `Bearer ${coordinatorToken}`);

    assert.equal(res.status, 403);
  });

  test("17. Forged role in request body or query does not grant deletion", async () => {
    const res = await request(app)
      .delete(`/api/students/${student1Id}`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ role: "principal", isAuthorized: true });

    assert.equal(res.status, 403);
  });

  test("18. Cannot delete non-student account (e.g. Teacher ID) via student delete endpoint", async () => {
    const res = await request(app)
      .delete(`/api/students/${teacherId}`)
      .set("Authorization", `Bearer ${principalToken}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test("19. Principal CAN deactivate student account (200 OK soft-delete)", async () => {
    const res = await request(app)
      .delete(`/api/students/${student2Id}`)
      .set("Authorization", `Bearer ${principalToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.student.status, "suspended");

    // Verify student is marked suspended in DB
    const studentDoc = await User.findById(student2Id);
    assert.equal(studentDoc.status, "suspended");
  });

  test("20. Deactivated student can no longer authenticate / login", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "bhavna.student@subharti.org",
      password: "Student@123"
    });

    // Login must be rejected for suspended user
    assert.equal(res.status, 403);
  });

  test("21. Academic records remain intact after student deactivation (no cascade loss)", async () => {
    // Student 1 records must still exist
    const attCount = await Attendance.countDocuments({ studentId: student1Id });
    const markCount = await ExamMark.countDocuments({ studentId: student1Id });
    assert.equal(attCount, 1);
    assert.equal(markCount, 1);
  });

  test("22. Admin CAN reactivate a suspended student account (200 OK)", async () => {
    const res = await request(app)
      .patch(`/api/students/${student2Id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.student.status, "verified");

    // Verify reactivated student can login again
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "bhavna.student@subharti.org",
      password: "Student@123"
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);
  });
});
