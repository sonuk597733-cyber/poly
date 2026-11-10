import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import TeacherProfile from "../src/models/TeacherProfile.js";
import HODProfile from "../src/models/HODProfile.js";
import Timetable from "../src/models/Timetable.js";
import LeaveApplication from "../src/models/LeaveApplication.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_hod_teachers_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("CollegeOS HOD Teacher Management V5 Test Suite", () => {
  let hodCseToken = "";
  let hodCseUser = null;
  let teacherCseUser = null;
  let teacherCseProfile = null;

  let hodMechToken = "";
  let hodMechUser = null;
  let teacherMechUser = null;
  let teacherMechProfile = null;

  let timetableDoc = null;
  let leaveDoc = null;

  before(async () => {
    await connectDB();

    // Clean test data
    await User.deleteMany({ email: /@test-teachersv5\.org$/ });
    await TeacherProfile.deleteMany({ employeeId: /^EMP-TEST-/ });
    await HODProfile.deleteMany({});
    await Timetable.deleteMany({ branch: { $in: ["CSE", "Mechanical"] } });
    await LeaveApplication.deleteMany({ applicantName: /Test Faculty/ });

    const pwdHash = await User.hashPassword("SecureFaculty@2026");

    // 1. Create HOD CSE User
    hodCseUser = await User.create({
      fullName: "Dr. Rina Singh",
      email: "hod.cse@test-teachersv5.org",
      passwordHash: pwdHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });

    await HODProfile.create({
      userId: hodCseUser._id,
      department: "Computer Science & Engineering"
    });

    // 2. Create Faculty CSE
    teacherCseUser = await User.create({
      fullName: "Dr. Sunita Deshpande Test",
      email: "sunita.faculty@test-teachersv5.org",
      passwordHash: pwdHash,
      role: "teacher",
      status: "active",
      isEmailVerified: true,
      bio: "Associate Professor in CSE"
    });

    teacherCseProfile = await TeacherProfile.create({
      userId: teacherCseUser._id,
      department: "CSE",
      employeeId: "EMP-TEST-CSE-01",
      designation: "Associate Professor",
      responsibilities: "OS Lab Lead",
      approvalStatus: "approved",
      subjects: ["Operating Systems", "Cloud Networks"]
    });

    // 3. Create HOD Mechanical User (Cross-department testing)
    hodMechUser = await User.create({
      fullName: "Dr. Ramesh Verma",
      email: "hod.mech@test-teachersv5.org",
      passwordHash: pwdHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true
    });

    await HODProfile.create({
      userId: hodMechUser._id,
      department: "Mechanical Engineering"
    });

    // 4. Create Faculty Mechanical
    teacherMechUser = await User.create({
      fullName: "Prof. Anil Kumar Mech",
      email: "anil.mech@test-teachersv5.org",
      passwordHash: pwdHash,
      role: "teacher",
      status: "active",
      isEmailVerified: true
    });

    teacherMechProfile = await TeacherProfile.create({
      userId: teacherMechUser._id,
      department: "Mechanical",
      employeeId: "EMP-TEST-MECH-01",
      designation: "Assistant Professor",
      responsibilities: "Thermodynamics Lead",
      approvalStatus: "approved",
      subjects: ["Thermodynamics", "Fluid Mechanics"]
    });

    // 5. Create Timetable Slot for CSE
    timetableDoc = await Timetable.create({
      branch: "CSE",
      academicYear: "3rd Year",
      semester: "Semester 5",
      dayOfWeek: "Monday",
      slots: [
        {
          startTime: "09:00 AM",
          endTime: "10:00 AM",
          subject: "Operating Systems",
          teacherId: teacherCseUser._id,
          teacherName: teacherCseUser.fullName,
          roomNo: "Room 101",
          type: "Lecture"
        }
      ]
    });

    // 6. Create Leave Application for CSE Teacher
    leaveDoc = await LeaveApplication.create({
      applicantId: teacherCseUser._id,
      applicantRole: "teacher",
      applicantName: teacherCseUser.fullName,
      department: "CSE",
      leaveType: "Academic / Duty",
      startDate: new Date("2026-11-15"),
      endDate: new Date("2026-11-17"),
      reason: "National Research Symposium at IIT Roorkee.",
      status: "pending"
    });

    // Login HOD CSE
    const resCse = await request(app)
      .post("/api/auth/login")
      .send({ email: "hod.cse@test-teachersv5.org", password: "SecureFaculty@2026" });
    hodCseToken = resCse.body.token;

    // Login HOD Mechanical
    const resMech = await request(app)
      .post("/api/auth/login")
      .send({ email: "hod.mech@test-teachersv5.org", password: "SecureFaculty@2026" });
    hodMechToken = resMech.body.token;
  });

  after(async () => {
    await User.deleteMany({ email: /@test-teachersv5\.org$/ });
    await TeacherProfile.deleteMany({ employeeId: /^EMP-TEST-/ });
    await HODProfile.deleteMany({});
    await Timetable.deleteMany({ branch: { $in: ["CSE", "Mechanical"] } });
    await LeaveApplication.deleteMany({ applicantName: /Test Faculty/ });
    await disconnectDB();
  });

  // TEST 1: HOD Faculty Overview KPI Metrics
  test("1. GET /api/academic/teachers/stats returns real department metrics", async () => {
    const res = await request(app)
      .get("/api/academic/teachers/stats")
      .set("Authorization", `Bearer ${hodCseToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.stats);
    assert.equal(res.body.stats.totalFaculty >= 1, true);
    assert.equal(res.body.stats.pendingLeaves >= 1, true);
    assert.equal(res.body.stats.weeklyTeachingHours >= 1, true);
  });

  // TEST 2: Faculty Directory with Department Isolation
  test("2. GET /api/academic/teachers enforces department isolation (CSE HOD sees only CSE faculty)", async () => {
    const res = await request(app)
      .get("/api/academic/teachers")
      .set("Authorization", `Bearer ${hodCseToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.teachers));

    // Must contain CSE teacher, MUST NOT contain Mech teacher
    const cseFound = res.body.teachers.some((t) => t.email === "sunita.faculty@test-teachersv5.org");
    const mechFound = res.body.teachers.some((t) => t.email === "anil.mech@test-teachersv5.org");

    assert.equal(cseFound, true, "CSE HOD should see CSE teacher");
    assert.equal(mechFound, false, "CSE HOD must NOT see Mechanical teacher");
  });

  // TEST 3: Search and Filtering
  test("3. GET /api/academic/teachers supports search query filtering", async () => {
    const res = await request(app)
      .get("/api/academic/teachers?search=Sunita")
      .set("Authorization", `Bearer ${hodCseToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.teachers.length >= 1, true);
    assert.ok(res.body.teachers[0].name.includes("Sunita"));
  });

  // TEST 4: Single Teacher Details with Deep Profile Tabs
  test("4. GET /api/academic/teachers/:id returns complete teacher profile with timetable & leaves", async () => {
    const res = await request(app)
      .get(`/api/academic/teachers/${teacherCseProfile._id}`)
      .set("Authorization", `Bearer ${hodCseToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.teacher.name, "Dr. Sunita Deshpande Test");
    assert.equal(res.body.timetableSlots.length >= 1, true);
    assert.equal(res.body.leaves.length >= 1, true);
    assert.ok(res.body.workload);
    assert.equal(res.body.workload.weeklyLoadHours >= 1, true);
  });

  // TEST 5: Cross-Department Boundary Security (HTTP 403 Forbidden)
  test("5. GET /api/academic/teachers/:id rejects cross-department access with HTTP 403", async () => {
    // Mechanical HOD tries to access CSE teacher profile
    const res = await request(app)
      .get(`/api/academic/teachers/${teacherCseProfile._id}`)
      .set("Authorization", `Bearer ${hodMechToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Forbidden/i);
  });

  // TEST 6: Profile Update & Persistence
  test("6. PATCH /api/academic/teachers/:id/profile updates editable fields and persists", async () => {
    const res = await request(app)
      .patch(`/api/academic/teachers/${teacherCseProfile._id}/profile`)
      .set("Authorization", `Bearer ${hodCseToken}`)
      .send({
        designation: "Senior Associate Professor",
        responsibilities: "OS Lab Lead & Accreditation Chair",
        subjects: ["Operating Systems", "Cloud Networks", "Advanced Distributed Systems"]
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.profile.designation, "Senior Associate Professor");

    // Verify database persistence
    const updated = await TeacherProfile.findById(teacherCseProfile._id);
    assert.equal(updated.designation, "Senior Associate Professor");
    assert.equal(updated.responsibilities, "OS Lab Lead & Accreditation Chair");
  });

  // TEST 7: Timetable Overlap Conflict Detection (HTTP 409 Conflict)
  test("7. POST /api/academic/teachers/:id/assign detects timetable conflict and returns HTTP 409", async () => {
    // Teacher already has class on Monday 09:00 AM - 10:00 AM.
    // Attempting to assign overlapping class on Monday 09:30 AM - 10:30 AM
    const res = await request(app)
      .post(`/api/academic/teachers/${teacherCseProfile._id}/assign`)
      .set("Authorization", `Bearer ${hodCseToken}`)
      .send({
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        dayOfWeek: "Monday",
        startTime: "09:30 AM",
        endTime: "10:30 AM",
        subject: "Cloud Networks",
        roomNo: "Hall 201",
        type: "Lecture"
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.conflictType, "TEACHER_DOUBLE_BOOKING");
    assert.match(res.body.message, /conflict/i);
  });

  // TEST 8: Valid Slot Assignment Persistence
  test("8. POST /api/academic/teachers/:id/assign successfully assigns non-conflicting slot", async () => {
    const res = await request(app)
      .post(`/api/academic/teachers/${teacherCseProfile._id}/assign`)
      .set("Authorization", `Bearer ${hodCseToken}`)
      .send({
        branch: "CSE",
        academicYear: "3rd Year",
        semester: "Semester 5",
        dayOfWeek: "Tuesday",
        startTime: "11:00 AM",
        endTime: "12:00 PM",
        subject: "Cloud Computing Theory",
        roomNo: "Room 105",
        type: "Lecture"
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);

    // Verify slot added to timetable
    const tt = await Timetable.findOne({ branch: "CSE", dayOfWeek: "Tuesday", semester: "Semester 5" });
    assert.ok(tt);
    const slot = tt.slots.find((s) => s.subject === "Cloud Computing Theory");
    assert.ok(slot);
    assert.equal(slot.startTime, "11:00 AM");
  });

  // TEST 9: Unassign Teaching Slot
  test("9. DELETE /api/academic/teachers/:id/unassign clears teacher association from timetable slot", async () => {
    const tt = await Timetable.findOne({ branch: "CSE", dayOfWeek: "Monday", semester: "Semester 5" });
    const slot = tt.slots[0];

    const res = await request(app)
      .delete(`/api/academic/teachers/${teacherCseProfile._id}/unassign`)
      .set("Authorization", `Bearer ${hodCseToken}`)
      .send({
        timetableId: tt._id.toString(),
        slotId: slot._id.toString()
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify slot is unassigned
    const updatedTT = await Timetable.findById(tt._id);
    const updatedSlot = updatedTT.slots.id(slot._id);
    assert.equal(updatedSlot.teacherId, null);
    assert.equal(updatedSlot.teacherName, "");
  });

  // TEST 10: Leave Sanctioning with Department Isolation
  test("10. PATCH /api/academic/leaves/:id/status allows HOD to sanction leave within department", async () => {
    const res = await request(app)
      .patch(`/api/academic/leaves/${leaveDoc._id}/status`)
      .set("Authorization", `Bearer ${hodCseToken}`)
      .send({
        status: "approved",
        remarks: "Approved for academic presentation."
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.leave.status, "approved");
    assert.equal(res.body.leave.reviewerRemarks, "Approved for academic presentation.");
  });

  // TEST 11: Cross-Department Leave Rejection
  test("11. PATCH /api/academic/leaves/:id/status blocks cross-department sanction with HTTP 403", async () => {
    // Create new CSE leave
    const newLeave = await LeaveApplication.create({
      applicantId: teacherCseUser._id,
      applicantRole: "teacher",
      applicantName: teacherCseUser.fullName,
      department: "CSE",
      leaveType: "Medical",
      startDate: new Date("2026-11-20"),
      endDate: new Date("2026-11-22"),
      reason: "Medical leave.",
      status: "pending"
    });

    // Mechanical HOD tries to decide CSE leave
    const res = await request(app)
      .patch(`/api/academic/leaves/${newLeave._id}/status`)
      .set("Authorization", `Bearer ${hodMechToken}`)
      .send({
        status: "approved",
        remarks: "Unauthorized attempt"
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Forbidden/i);
  });
});
