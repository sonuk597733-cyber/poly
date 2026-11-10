import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import PendingRegistration from "../src/models/PendingRegistration.js";
import StudentProfile from "../src/models/StudentProfile.js";
import TeacherProfile from "../src/models/TeacherProfile.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { getDispatchedDevEmails, clearDispatchedDevEmails } from "../src/services/emailService.js";

// Use test database environment
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

describe("CollegeOS Production Authentication, Session & Profile Audit Test Suite", () => {
  before(async () => {
    await connectDB();
    await User.deleteMany({});
    await PendingRegistration.deleteMany({});
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await PendingRegistration.deleteMany({});
    await StudentProfile.deleteMany({});
    await TeacherProfile.deleteMany({});
    await disconnectDB();
  });

  // ==========================================
  // 1. Healthcheck & CORS / CSRF
  // ==========================================
  describe("Healthcheck, CORS & CSRF Defense", () => {
    test("GET /api/health should return 200 and healthy DB connection", async () => {
      const res = await request(app).get("/api/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, "healthy");
      assert.equal(res.body.database.connected, true);
    });

    test("CORS should block unauthorized foreign browser origins", async () => {
      const res = await request(app)
        .get("/api/health")
        .set("Origin", "http://malicious-attacker-domain.xyz");

      // Supertest/CORS: When origin is blocked, Access-Control-Allow-Origin header is omitted
      assert.equal(res.headers["access-control-allow-origin"], undefined);
    });

    test("CSRF defense should block mutating cookie-authenticated request from foreign origin", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Cookie", ["collegeos_token=any_token_string"])
        .set("Origin", "http://evil-site.com")
        .send({ bio: "Hacked bio" });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /CSRF protection/i);
    });
  });

  // ==========================================
  // 2. Registration Staging & Security
  // ==========================================
  describe("Registration Staging (POST /api/auth/register)", () => {
    test("should stage new student in PendingRegistration and dispatch 6-digit OTP", async () => {
      const payload = {
        fullName: "Aarav Sharma",
        email: "aarav.test@subharti.org",
        password: "Password@123",
        role: "student",
        branch: "CSE",
        academicYear: "1st Year",
        semester: "Semester 1",
        enrollmentNo: "SVSU/2026/CSE/101"
      };

      const res = await request(app).post("/api/auth/register").send(payload);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.requiresOtp, true);
      assert.equal(res.body.email, "aarav.test@subharti.org");
      assert.ok(res.body.maskedEmail);
      assert.equal(res.body.expiresInSeconds, 300);
      assert.ok(res.body.devOtp);
      assert.equal(res.body.devOtp.length, 6);

      const pending = await PendingRegistration.findOne({ email: "aarav.test@subharti.org" });
      assert.ok(pending);
      assert.equal(pending.fullName, "Aarav Sharma");
      assert.notEqual(pending.passwordHash, "Password@123");
      assert.ok(pending.passwordHash.startsWith("$2"));
      assert.equal(pending.otpHash.length, 64);

      // Verify not in User collection
      const user = await User.findOne({ email: "aarav.test@subharti.org" });
      assert.equal(user, null);
    });

    test("should reject invalid registration input with HTTP 400", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "A",
        email: "invalid-email",
        password: "short"
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.errors.length > 0);
    });

    test("should block privileged admin role escalation via public registration", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Malicious User",
        email: "hacker@test.com",
        password: "Password@123",
        role: "admin"
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /cannot be provisioned/i);
    });
  });

  // ==========================================
  // 3. Email OTP Verification Lifecycle & Concurrency
  // ==========================================
  describe("Email OTP Verification Lifecycle (POST /api/auth/verify-email-otp)", () => {
    let devOtp = "";

    before(async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Aarav Sharma",
        email: "aarav.test@subharti.org",
        password: "Password@123",
        role: "student",
        branch: "CSE",
        academicYear: "1st Year",
        semester: "Semester 1",
        enrollmentNo: "SVSU/2026/CSE/101"
      });
      devOtp = res.body.devOtp;
    });

    test("should reject incorrect 6-digit OTP with 400 and track remaining attempts", async () => {
      const res = await request(app).post("/api/auth/verify-email-otp").send({
        email: "aarav.test@subharti.org",
        otp: "000000"
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid verification code/i);
      assert.equal(res.body.remainingAttempts, 4);
    });

    test("should reject verification when code length is not 6 digits", async () => {
      const res = await request(app).post("/api/auth/verify-email-otp").send({
        email: "aarav.test@subharti.org",
        otp: "123"
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    test("should reject expired OTP with 400 and isExpired flag", async () => {
      // Set expiry to past
      await PendingRegistration.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { otpExpiresAt: new Date(Date.now() - 1000) } }
      );

      const res = await request(app).post("/api/auth/verify-email-otp").send({
        email: "aarav.test@subharti.org",
        otp: devOtp
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.isExpired, true);
      assert.match(res.body.message, /expired/i);

      // Restore expiry
      await PendingRegistration.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) } }
      );
    });

    test("should enforce lockout when attempts reach 5", async () => {
      // Set attempts to 5
      await PendingRegistration.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { otpAttempts: 5 } }
      );

      const res = await request(app).post("/api/auth/verify-email-otp").send({
        email: "aarav.test@subharti.org",
        otp: devOtp
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.maxAttemptsExceeded, true);
      assert.match(res.body.message, /maximum.*attempts/i);

      // Reset attempts to 1 for valid verification test
      await PendingRegistration.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { otpAttempts: 1 } }
      );
    });

    test("should verify valid OTP, provision User + StudentProfile, and issue JWT", async () => {
      const res = await request(app).post("/api/auth/verify-email-otp").send({
        email: "aarav.test@subharti.org",
        otp: devOtp
      });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);
      assert.ok(res.body.user);
      assert.equal(res.body.user.email, "aarav.test@subharti.org");
      assert.equal(res.body.user.isEmailVerified, true);

      // Verify PendingRegistration was cleared
      const pending = await PendingRegistration.findOne({ email: "aarav.test@subharti.org" });
      assert.equal(pending, null);

      // Verify StudentProfile was created in MongoDB
      const dbUser = await User.findOne({ email: "aarav.test@subharti.org" });
      assert.ok(dbUser);
      const studentProfile = await StudentProfile.findOne({ userId: dbUser._id });
      assert.ok(studentProfile);
      assert.equal(studentProfile.branch, "CSE");
      assert.equal(studentProfile.enrollmentNo, "SVSU/2026/CSE/101");
    });

    test("should handle concurrent verification requests gracefully without duplicate accounts", async () => {
      // Stage another user
      const stageRes = await request(app).post("/api/auth/register").send({
        fullName: "Concurrent Student",
        email: "concurrent@subharti.org",
        password: "Password@123",
        role: "student",
        branch: "ECE"
      });
      const cOtp = stageRes.body.devOtp;

      // Dispatch 2 verification requests concurrently
      const [res1, res2] = await Promise.all([
        request(app).post("/api/auth/verify-email-otp").send({ email: "concurrent@subharti.org", otp: cOtp }),
        request(app).post("/api/auth/verify-email-otp").send({ email: "concurrent@subharti.org", otp: cOtp })
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one should succeed with 201, and the other should receive 409 (already verified/claimed)
      assert.deepEqual(statuses, [201, 409]);

      // Exactly ONE user document in DB
      const userCount = await User.countDocuments({ email: "concurrent@subharti.org" });
      assert.equal(userCount, 1);
    });

    test("should reject duplicate registration once account is active", async () => {
      const res = await request(app).post("/api/auth/register").send({
        fullName: "Aarav Sharma Duplicate",
        email: "aarav.test@subharti.org",
        password: "Password@123",
        role: "student"
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });
  });

  // ==========================================
  // 4. OTP Resend Cooldown
  // ==========================================
  describe("OTP Resend Cooldown (POST /api/auth/resend-email-otp)", () => {
    test("should enforce 45s cooldown on resending OTP", async () => {
      await request(app).post("/api/auth/register").send({
        fullName: "Rahul Varma",
        email: "rahul.test@subharti.org",
        password: "Password@123",
        role: "student",
        branch: "Mechanical"
      });

      const resendRes = await request(app).post("/api/auth/resend-email-otp").send({
        email: "rahul.test@subharti.org"
      });

      assert.equal(resendRes.status, 429);
      assert.equal(resendRes.body.success, false);
      assert.match(resendRes.body.message, /please wait/i);
      assert.ok(resendRes.body.retryAfterSeconds > 0);
    });
  });

  // ==========================================
  // 5. Unverified Account Login Guard & Teacher Provisioning
  // ==========================================
  describe("Unverified Account Login Guard & Teacher Provisioning", () => {
    test("should block unverified user from logging in with HTTP 403", async () => {
      // Create unverified user directly in DB
      const hash = await User.hashPassword("Password@123");
      await User.create({
        fullName: "Unverified User",
        email: "unverified@subharti.org",
        passwordHash: hash,
        role: "student",
        isEmailVerified: false
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "unverified@subharti.org",
        password: "Password@123"
      });

      assert.equal(res.status, 403);
      assert.equal(res.body.unverified, true);
      assert.match(res.body.message, /not been verified/i);
    });

    test("should stage teacher registration and verify with pending_approval status", async () => {
      const regRes = await request(app).post("/api/auth/register").send({
        fullName: "Dr. Sunita Rao",
        email: "sunita.test@subharti.org",
        password: "Password@123",
        role: "teacher",
        department: "Computer Science",
        employeeId: "FAC/SVSU/2026/042",
        responsibilities: "Digital Logic Design and AI Systems"
      });

      assert.equal(regRes.status, 200);
      const teacherOtp = regRes.body.devOtp;

      const verifyRes = await request(app).post("/api/auth/verify-email-otp").send({
        email: "sunita.test@subharti.org",
        otp: teacherOtp
      });

      assert.equal(verifyRes.status, 201);
      assert.equal(verifyRes.body.requiresApproval, true);

      const teacher = await User.findOne({ email: "sunita.test@subharti.org" });
      assert.ok(teacher);
      assert.equal(teacher.status, "pending_approval");

      const tProfile = await TeacherProfile.findOne({ userId: teacher._id });
      assert.ok(tProfile);
      assert.equal(tProfile.department, "Computer Science");
      assert.equal(tProfile.approvalStatus, "pending_approval");
    });
  });

  // ==========================================
  // 6. JWT Security, Expiry & Revocation
  // ==========================================
  describe("JWT Security & Token Invalidation", () => {
    test("should reject expired JWT token with 401", async () => {
      // Craft expired token
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" }
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.match(res.body.message, /session has expired/i);
    });

    test("should reject malformed or tampered JWT with 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.fake.token");

      assert.equal(res.status, 401);
      assert.match(res.body.message, /invalid authentication/i);
    });

    test("should reject JWT signed with wrong secret with 401", async () => {
      const wrongSecretToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: "student" },
        "wrong_fake_secret_key"
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${wrongSecretToken}`);

      assert.equal(res.status, 401);
    });

    test("should invalidate old JWT tokens issued prior to password change", async () => {
      // Login to obtain active token
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });
      const oldToken = loginRes.body.token;

      // Update passwordChangedAt in DB to 1 second in the future
      await User.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { passwordChangedAt: new Date(Date.now() + 2000) } }
      );

      // Attempt to access with old token
      const checkRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${oldToken}`);

      assert.equal(checkRes.status, 401);
      assert.match(checkRes.body.message, /password was recently changed/i);

      // Reset passwordChangedAt for subsequent tests
      await User.updateOne(
        { email: "aarav.test@subharti.org" },
        { $set: { passwordChangedAt: null } }
      );
    });
  });

  // ==========================================
  // 7. Login, Cookie Consistency & Current User
  // ==========================================
  describe("Login Flow & Cookie Consistency", () => {
    test("should authenticate verified student and return token + cookie with Path=/", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.token);

      const cookies = res.headers["set-cookie"];
      assert.ok(cookies);
      assert.ok(cookies.some((c) => c.includes("collegeos_token=") && c.includes("Path=/")));
    });

    test("should reject incorrect password with generic 401 error", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "WrongPassword@999"
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid email address or password/i);
    });

    test("should reject unregistered email with generic 401 error", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "unknown.user@subharti.org",
        password: "Password@123"
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid email address or password/i);
    });

    test("POST /api/auth/logout should clear cookie with matching Path=/", async () => {
      const res = await request(app).post("/api/auth/logout");
      assert.equal(res.status, 200);
      const cookies = res.headers["set-cookie"];
      assert.ok(cookies);
      assert.ok(cookies.some((c) => c.includes("collegeos_token=;") && c.includes("Path=/")));
    });
  });

  // ==========================================
  // 8. Profile Authorization & Field Protection
  // ==========================================
  describe("Profile Authorization (/api/profile)", () => {
    let studentToken = "";

    before(async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });
      studentToken = loginRes.body.token;
    });

    test("GET /api/profile should return user details and linked StudentProfile", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.user);
      assert.equal(res.body.user.email, "aarav.test@subharti.org");
      assert.ok(res.body.profile);
      assert.equal(res.body.profile.branch, "CSE");
    });

    test("PATCH /api/profile should update allowlisted fields and ignore role escalation", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          fullName: "Aarav Sharma Updated",
          bio: "Passionate about robotics, embedded systems and edge AI.",
          phone: "+91 98765 43210",
          skills: ["Python", "Embedded C", "ROS 2"],
          // Tampering attempt:
          role: "admin",
          status: "verified",
          enrollmentNo: "HACKED_ENROLLMENT",
          attendancePercentage: 100
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.user.fullName, "Aarav Sharma Updated");
      assert.equal(res.body.user.bio, "Passionate about robotics, embedded systems and edge AI.");
      assert.equal(res.body.user.phone, "+91 98765 43210");
      // Verify privilege escalation was strictly blocked
      assert.equal(res.body.user.role, "student");
      assert.equal(res.body.profile.enrollmentNo, "SVSU/2026/CSE/101");
      assert.notEqual(res.body.profile.enrollmentNo, "HACKED_ENROLLMENT");
    });
  });

  // ==========================================
  // 9. Avatar Upload Security & Magic Bytes
  // ==========================================
  describe("Avatar Upload Security (/api/profile/avatar)", () => {
    let studentToken = "";

    before(async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });
      studentToken = loginRes.body.token;
    });

    test("should accept valid PNG image with genuine magic bytes", async () => {
      // 8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A followed by dummy data
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ]);

      const res = await request(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("avatar", pngBuffer, "profile.png");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.avatarUrl);
      assert.match(res.body.avatarUrl, /(collegeos\/avatars|ik\.imagekit\.io)/);
    });

    test("should reject spoofed file (fake .png extension containing plain text script)", async () => {
      const fakeImage = Buffer.from("console.log('malicious script pretending to be image');");

      const res = await request(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("avatar", fakeImage, "fake_image.png");

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /file signature validation failed/i);
    });

    test("should reject files exceeding 2MB limit with HTTP 400", async () => {
      // Allocate 2.2MB buffer
      const oversizedBuffer = Buffer.alloc(2.2 * 1024 * 1024);
      oversizedBuffer[0] = 0x89;
      oversizedBuffer[1] = 0x50;
      oversizedBuffer[2] = 0x4e;
      oversizedBuffer[3] = 0x47;

      const res = await request(app)
        .post("/api/profile/avatar")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("avatar", oversizedBuffer, "huge_avatar.png");

      assert.equal(res.status, 400);
      assert.match(res.body.message, /2MB/i);
    });
  });

  // ==========================================
  // 10. Password Change & Password Recovery
  // ==========================================
  describe("Password Change & Recovery", () => {
    let studentToken = "";
    let unhashedToken = "";

    before(async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });
      studentToken = loginRes.body.token;
      clearDispatchedDevEmails();
    });

    test("POST /api/profile/change-password should verify current password and issue fresh session", async () => {
      // Wrong current password
      const failRes = await request(app)
        .post("/api/profile/change-password")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          currentPassword: "WrongPassword@123",
          newPassword: "BrandNewPassword@2026"
        });

      assert.equal(failRes.status, 400);
      assert.match(failRes.body.message, /current password does not match/i);

      // Valid change
      const successRes = await request(app)
        .post("/api/profile/change-password")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          currentPassword: "Password@123",
          newPassword: "BrandNewPassword@2026"
        });

      assert.equal(successRes.status, 200);
      assert.equal(successRes.body.success, true);
      assert.ok(successRes.body.token);

      // Verify old password fails
      const oldLoginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "Password@123"
      });
      assert.equal(oldLoginRes.status, 401);

      // Verify new password logs in
      const newLoginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "BrandNewPassword@2026"
      });
      assert.equal(newLoginRes.status, 200);
      assert.equal(newLoginRes.body.success, true);
    });

    test("POST /api/auth/forgot-password should dispatch token and not leak user existence", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "aarav.test@subharti.org"
      });

      assert.equal(res.status, 200);
      assert.match(res.body.message, /dispatched/i);

      const emails = getDispatchedDevEmails();
      assert.ok(emails.length > 0);
      const latest = emails[emails.length - 1];
      assert.equal(latest.to, "aarav.test@subharti.org");

      const match = latest.text.match(/token=([a-f0-9]{64})/);
      assert.ok(match);
      unhashedToken = match[1];

      // Unknown email should still return identical generic message
      const unknownRes = await request(app).post("/api/auth/forgot-password").send({
        email: "ghost@subharti.org"
      });
      assert.equal(unknownRes.status, 200);
      assert.equal(unknownRes.body.message, res.body.message);
    });

    test("POST /api/auth/reset-password should reject invalid token with 400", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "0000000000000000000000000000000000000000000000000000000000000000",
        newPassword: "FinalPassword@2026"
      });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /invalid or has expired/i);
    });

    test("POST /api/auth/reset-password should reset password and reject reuse", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: unhashedToken,
        newPassword: "FinalPassword@2026"
      });

      assert.equal(res.status, 200);
      assert.match(res.body.message, /reset successfully/i);

      // Login with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "FinalPassword@2026"
      });
      assert.equal(loginRes.status, 200);

      // Reusing token must fail
      const reuseRes = await request(app).post("/api/auth/reset-password").send({
        token: unhashedToken,
        newPassword: "AnotherPassword@2026"
      });
      assert.equal(reuseRes.status, 400);
      assert.match(reuseRes.body.message, /invalid or has expired/i);
    });
  });

  // ==========================================
  // 11. Cover Photo Upload & Teacher Student Roster
  // ==========================================
  describe("Cover Photo Upload & Teacher Student Roster Access", () => {
    let studentToken = "";
    let teacherToken = "";
    let studentId = "";

    before(async () => {
      // Login student
      const sLogin = await request(app).post("/api/auth/login").send({
        email: "aarav.test@subharti.org",
        password: "FinalPassword@2026"
      });
      studentToken = sLogin.body.token;
      studentId = sLogin.body.user.id;

      // Register and verify a teacher
      const regRes = await request(app).post("/api/auth/register").send({
        fullName: "Prof. Vikram Singh",
        email: "vikram.prof@subharti.org",
        password: "Password@123",
        role: "teacher",
        department: "CSE",
        employeeId: "EMP-SVSU-909"
      });

      if (regRes.body.devOtp) {
        await request(app).post("/api/auth/verify-email-otp").send({
          email: "vikram.prof@subharti.org",
          otp: regRes.body.devOtp
        });

        // Set status to verified so teacher can log in
        await User.updateOne({ email: "vikram.prof@subharti.org" }, { status: "verified" });

        const tLogin = await request(app).post("/api/auth/login").send({
          email: "vikram.prof@subharti.org",
          password: "Password@123"
        });
        teacherToken = tLogin.body.token;
      }
    });

    test("POST /api/profile/cover should accept valid image and update coverUrl", async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ]);

      const res = await request(app)
        .post("/api/profile/cover")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("cover", pngBuffer, "cover.png");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.coverUrl);
      assert.match(res.body.coverUrl, /(collegeos\/covers|ik\.imagekit\.io)/);
    });

    test("POST /api/profile/cover should reject spoofed file with 400", async () => {
      const fakeImage = Buffer.from("console.log('malicious script pretending to be cover image');");

      const res = await request(app)
        .post("/api/profile/cover")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("cover", fakeImage, "fake_cover.png");

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /file signature validation failed/i);
    });

    test("GET /api/profile/students should reject student with HTTP 403", async () => {
      const res = await request(app)
        .get("/api/profile/students")
        .set("Authorization", `Bearer ${studentToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /Forbidden/i);
    });

    test("GET /api/profile/students should permit teacher with HTTP 200 and return student list", async () => {
      const res = await request(app)
        .get("/api/profile/students")
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.students));
      assert.ok(res.body.students.length > 0);

      const studentRecord = res.body.students.find((s) => s.email === "aarav.test@subharti.org");
      assert.ok(studentRecord);
      assert.equal(studentRecord.fullName, "Aarav Sharma Updated");
      assert.equal(studentRecord.branch, "CSE");
      assert.ok(studentRecord.enrollmentNo);
      assert.equal(typeof studentRecord.attendancePercentage, "number");
    });

    test("GET /api/profile/students/:id should return single student details to teacher", async () => {
      const res = await request(app)
        .get(`/api/profile/students/${studentId}`)
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.student);
      assert.equal(res.body.student.id, studentId);
      assert.equal(res.body.student.fullName, "Aarav Sharma Updated");
      assert.equal(res.body.student.branch, "CSE");
    });

    test("GET /api/profile/students/:id should return 404 for non-existent student", async () => {
      const dummyId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/profile/students/${dummyId}`)
        .set("Authorization", `Bearer ${teacherToken}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });
});
