import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import HODProfile from "../src/models/HODProfile.js";
import SystemSetting from "../src/models/SystemSetting.js";
import AuditLog from "../src/models/AuditLog.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_hod_settings_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("HOD Settings V4 & Persistence Test Suite", () => {
  let hodToken = "";
  let hodUser = null;
  let studentToken = "";
  let studentUser = null;

  before(async () => {
    await connectDB();

    await User.deleteMany({ email: /@test-settingsv4\.org$/ });
    await HODProfile.deleteMany({});
    await SystemSetting.deleteMany({});
    await AuditLog.deleteMany({});

    const pwdHash = await User.hashPassword("HodSecure@2026");

    // 1. Create HOD User
    hodUser = await User.create({
      fullName: "Dr. Rajesh K. Sharma",
      email: "hod.cse@test-settingsv4.org",
      passwordHash: pwdHash,
      role: "hod",
      status: "verified",
      isEmailVerified: true,
      lastLoginAt: new Date("2026-10-29T10:30:00Z"),
      headline: "Professor & HOD, Computer Science",
      bio: "Dedicated academic leader.",
      phone: "+91 98765 43210"
    });

    await HODProfile.create({
      userId: hodUser._id,
      department: "CSE",
      leadershipDetails: "Department Chair since 2022"
    });

    // 2. Create Student User for RBAC check
    studentUser = await User.create({
      fullName: "Aman Verma",
      email: "aman.student@test-settingsv4.org",
      passwordHash: pwdHash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });

    // Login HOD
    const hodLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "hod.cse@test-settingsv4.org", password: "HodSecure@2026" });
    assert.equal(hodLoginRes.status, 200);
    hodToken = hodLoginRes.body.token;

    // Login Student
    const studentLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "aman.student@test-settingsv4.org", password: "HodSecure@2026" });
    assert.equal(studentLoginRes.status, 200);
    studentToken = studentLoginRes.body.token;
  });

  after(async () => {
    await User.deleteMany({ email: /@test-settingsv4\.org$/ });
    await HODProfile.deleteMany({});
    await SystemSetting.deleteMany({});
    await AuditLog.deleteMany({});
    await disconnectDB();
  });

  test("1. GET /api/health returns real system health status", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, "healthy");
    assert.equal(res.body.service, "CollegeOS Core API Gateway");
    assert.ok(res.body.database);
    assert.equal(res.body.database.connected, true);
    assert.ok(typeof res.body.uptimeSeconds === "number");
  });

  test("2. PATCH /api/profile saves HOD preferences and allowlisted profile fields", async () => {
    const payload = {
      fullName: "Prof. Dr. Rajesh Kumar Sharma",
      phone: "+91 99887 76655",
      headline: "Senior Professor & Department Chair of Computer Science",
      bio: "Overseeing outcome-based education, NBA accreditation, and departmental research.",
      preferences: {
        theme: "dark",
        tableDensity: "compact",
        defaultLandingTab: "teachers",
        tablePageSize: 25,
        reducedMotion: true,
        notifications: {
          facultyLeaveAlerts: true,
          examSubmissionAlerts: false,
          nbaComplianceAlerts: true,
          lowAttendanceAlerts: true,
          academicRiskAlerts: true,
          emailDigest: true
        },
        reports: {
          defaultPeriod: "academic_year",
          exportFormat: "csv"
        }
      }
    };

    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${hodToken}`)
      .send(payload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.fullName, "Prof. Dr. Rajesh Kumar Sharma");
    assert.equal(res.body.user.phone, "+91 99887 76655");
    assert.equal(res.body.user.preferences.theme, "dark");
    assert.equal(res.body.user.preferences.tableDensity, "compact");
    assert.equal(res.body.user.preferences.defaultLandingTab, "teachers");
    assert.equal(res.body.user.preferences.tablePageSize, 25);
    assert.equal(res.body.user.preferences.reducedMotion, true);
    assert.equal(res.body.user.preferences.notifications.examSubmissionAlerts, false);
    assert.equal(res.body.user.preferences.notifications.emailDigest, true);
    assert.equal(res.body.user.preferences.reports.defaultPeriod, "academic_year");
    assert.equal(res.body.user.preferences.reports.exportFormat, "csv");

    // Verify DB persistence
    const savedUser = await User.findById(hodUser._id);
    assert.equal(savedUser.preferences.theme, "dark");
    assert.equal(savedUser.preferences.tableDensity, "compact");
    assert.equal(savedUser.preferences.notifications.examSubmissionAlerts, false);
  });

  test("3. PATCH /api/profile prevents privilege escalation or status tampering", async () => {
    const maliciousPayload = {
      role: "admin",
      status: "suspended",
      isEmailVerified: false
    };

    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${hodToken}`)
      .send(maliciousPayload);

    assert.equal(res.status, 200);
    const dbUser = await User.findById(hodUser._id);
    assert.equal(dbUser.role, "hod");
    assert.equal(dbUser.status, "verified");
    assert.equal(dbUser.isEmailVerified, true);
  });

  test("4. GET /api/academic/settings seeds defaults and returns settings map", async () => {
    const res = await request(app)
      .get("/api/academic/settings")
      .set("Authorization", `Bearer ${hodToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.settings);
    assert.equal(res.body.settings.min_attendance_threshold, 75);
    assert.equal(res.body.settings.academic_session, "2024-2025");
  });

  test("5. PATCH /api/academic/settings allows HOD to update threshold and writes AuditLog", async () => {
    const updatePayload = {
      key: "min_attendance_threshold",
      value: 80
    };

    const res = await request(app)
      .patch("/api/academic/settings")
      .set("Authorization", `Bearer ${hodToken}`)
      .send(updatePayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.setting.value, 80);

    // Verify AuditLog entry was created
    const log = await AuditLog.findOne({
      action: "SYSTEM_SETTING_UPDATED",
      resourceId: "min_attendance_threshold"
    });
    assert.ok(log);
    assert.equal(log.performerRole, "hod");
    assert.equal(log.performedBy.toString(), hodUser._id.toString());
    assert.equal(log.details.value, 80);
  });

  test("6. Student is forbidden (HTTP 403) from updating academic settings", async () => {
    const res = await request(app)
      .patch("/api/academic/settings")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ key: "min_attendance_threshold", value: 50 });

    assert.equal(res.status, 403);
  });

  test("7. Password update enforces security and rejects incorrect current password", async () => {
    const badRes = await request(app)
      .post("/api/profile/change-password")
      .set("Authorization", `Bearer ${hodToken}`)
      .send({
        currentPassword: "WrongCurrentPassword@123",
        newPassword: "NewHodPassword@2026"
      });
    assert.equal(badRes.status, 400);

    const goodRes = await request(app)
      .post("/api/profile/change-password")
      .set("Authorization", `Bearer ${hodToken}`)
      .send({
        currentPassword: "HodSecure@2026",
        newPassword: "NewHodPassword@2026"
      });
    assert.equal(goodRes.status, 200);
    assert.equal(goodRes.body.success, true);

    // Verify login with new password
    const newLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "hod.cse@test-settingsv4.org", password: "NewHodPassword@2026" });
    assert.equal(newLoginRes.status, 200);
  });
});
