import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import StudentProfile from "../src/models/StudentProfile.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/collegeos_test";
process.env.JWT_SECRET = "test_jwt_secret_collegeos_svsu_2026";

// Minimal 1x1 valid JPEG image buffer with valid magic bytes (FF D8 FF)
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08,
  0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a,
  0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d,
  0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22,
  0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34,
  0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0,
  0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
  0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06,
  0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3f, 0x00, 0xbf, 0x80, 0xff, 0xd9
]);

describe("CollegeOS Student Profile Permanent Database Persistence Test Suite", () => {
  let student1Token = "";
  let student1Id = "";
  let student2Token = "";
  let student2Id = "";

  before(async () => {
    await connectDB();

    // Clean test DB
    await User.deleteMany({ email: /@subharti\.org$/ });
    await StudentProfile.deleteMany({});

    // 1. Setup Student 1 (Aryan - initial CSE)
    const s1Hash = await User.hashPassword("Student@123");
    const s1 = await User.create({
      fullName: "Aryan Verma",
      email: "aryan.verma@subharti.org",
      passwordHash: s1Hash,
      role: "student",
      status: "verified",
      isEmailVerified: true,
      phone: "+91 9876543211",
      bio: "Diploma candidate in CSE"
    });
    student1Id = s1._id.toString();

    await StudentProfile.create({
      userId: s1._id,
      branch: "CSE",
      academicYear: "1st Year",
      semester: "Semester 1",
      enrollmentNo: "SVSU/2026/CSE/101",
      skills: ["C++", "HTML", "CSS"],
      bio: "Diploma candidate in CSE"
    });

    const s1Login = await request(app).post("/api/auth/login").send({
      email: "aryan.verma@subharti.org",
      password: "Student@123"
    });
    student1Token = s1Login.body.token;

    // 2. Setup Student 2 (Bhavna - brand new student WITHOUT StudentProfile record yet)
    const s2Hash = await User.hashPassword("Student@123");
    const s2 = await User.create({
      fullName: "Bhavna Patel",
      email: "bhavna.patel@subharti.org",
      passwordHash: s2Hash,
      role: "student",
      status: "verified",
      isEmailVerified: true
    });
    student2Id = s2._id.toString();

    const s2Login = await request(app).post("/api/auth/login").send({
      email: "bhavna.patel@subharti.org",
      password: "Student@123"
    });
    student2Token = s2Login.body.token;
  });

  after(async () => {
    await disconnectDB();
  });

  test("1. GET /api/profile unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/profile");
    assert.equal(res.status, 401);
  });

  test("2. GET /api/profile returns authenticated student's profile and user records", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.fullName, "Aryan Verma");
    assert.equal(res.body.user.email, "aryan.verma@subharti.org");
    assert.equal(res.body.profile.branch, "CSE");
    assert.equal(res.body.profile.enrollmentNo, "SVSU/2026/CSE/101");
    assert.deepEqual(res.body.profile.skills, ["C++", "HTML", "CSS"]);
  });

  test("3. GET /api/profile safely creates default StudentProfile when none exists", async () => {
    // Bhavna had no StudentProfile created before
    const countBefore = await StudentProfile.countDocuments({ userId: student2Id });
    assert.equal(countBefore, 0);

    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${student2Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.profile);
    assert.equal(res.body.profile.branch, "CSE");
    assert.equal(res.body.profile.semester, "Semester 1");

    // Verify record now safely exists in MongoDB
    const countAfter = await StudentProfile.countDocuments({ userId: student2Id });
    assert.equal(countAfter, 1);
  });

  test("4. PATCH /api/profile saves complete profile fields into MongoDB", async () => {
    const updatePayload = {
      fullName: "Aryan K. Verma",
      headline: "Diploma in CSE | Full-Stack Web Developer",
      phone: "+91 9811223344",
      location: "Meerut, UP",
      branch: "Computer Science", // Friendly alias -> should normalize to CSE
      semester: "Semester 4",
      academicYear: "2nd Year",
      enrollmentNo: "SVSU/2026/CSE/404",
      bio: "Passionate full-stack diploma developer building real-time college systems.",
      skills: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"],
      linkedin: "https://linkedin.com/in/aryan-verma-svsu",
      github: "https://github.com/aryan-verma",
      portfolio: "https://aryanverma.dev",
      education: [
        {
          title: "Diploma in Computer Science",
          issuer: "Subharti Polytechnic",
          year: "2024 - 2027",
          description: "Major in Software Engineering & Networking."
        },
        {
          title: "Secondary School Examination (10th)",
          issuer: "CBSE Board",
          year: "2024",
          description: "Graduated with 92% aggregate."
        }
      ],
      projects: [
        {
          title: "CollegeOS Portal",
          issuer: "React, Node, Express, MongoDB",
          year: "2026",
          description: "Engineered full-stack responsive polytechnic dashboard."
        }
      ],
      certifications: [
        {
          title: "AWS Cloud Practitioner",
          issuer: "Amazon Web Services",
          year: "2026",
          description: "Foundational cloud services and security."
        }
      ],
      achievements: [
        {
          title: "1st Place - Inter-Polytechnic Hackathon",
          issuer: "SVSU TechFest",
          year: "2026",
          description: "Developed real-time attendance monitor."
        }
      ]
    };

    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${student1Token}`)
      .send(updatePayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.fullName, "Aryan K. Verma");
    assert.equal(res.body.user.phone, "+91 9811223344");
    assert.equal(res.body.user.headline, "Diploma in CSE | Full-Stack Web Developer");
    assert.equal(res.body.user.location, "Meerut, UP");

    // Profile returned
    assert.equal(res.body.profile.branch, "CSE");
    assert.equal(res.body.profile.semester, "Semester 4");
    assert.equal(res.body.profile.academicYear, "2nd Year");
    // Aryan's assigned enrollment number is securely protected from tampering
    assert.equal(res.body.profile.enrollmentNo, "SVSU/2026/CSE/101");
    assert.deepEqual(res.body.profile.skills, ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"]);
    assert.equal(res.body.profile.education.length, 2);
    assert.equal(res.body.profile.projects.length, 1);
    assert.equal(res.body.profile.certifications.length, 1);
    assert.equal(res.body.profile.achievements.length, 1);
  });

  test("4b. Student with unassigned enrollment number can set it initially", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        enrollmentNo: "SVSU/2026/CSE/202",
        bio: "Bhavna's bio"
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.profile.enrollmentNo, "SVSU/2026/CSE/202");

    // Verify in MongoDB
    const dbProfile = await StudentProfile.findOne({ userId: student2Id });
    assert.equal(dbProfile.enrollmentNo, "SVSU/2026/CSE/202");
  });

  test("5. Directly verify MongoDB is the source of truth for all saved fields", async () => {
    const dbUser = await User.findById(student1Id);
    assert.ok(dbUser);
    assert.equal(dbUser.fullName, "Aryan K. Verma");
    assert.equal(dbUser.phone, "+91 9811223344");
    assert.equal(dbUser.headline, "Diploma in CSE | Full-Stack Web Developer");
    assert.equal(dbUser.location, "Meerut, UP");
    assert.equal(dbUser.bio, "Passionate full-stack diploma developer building real-time college systems.");

    const dbProfile = await StudentProfile.findOne({ userId: student1Id });
    assert.ok(dbProfile);
    assert.equal(dbProfile.branch, "CSE");
    assert.equal(dbProfile.semester, "Semester 4");
    assert.equal(dbProfile.academicYear, "2nd Year");
    assert.equal(dbProfile.enrollmentNo, "SVSU/2026/CSE/101");
    assert.deepEqual(dbProfile.skills, ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"]);
    assert.equal(dbProfile.education[0].title, "Diploma in Computer Science");
    assert.equal(dbProfile.projects[0].title, "CollegeOS Portal");
    assert.equal(dbProfile.certifications[0].title, "AWS Cloud Practitioner");
    assert.equal(dbProfile.achievements[0].title, "1st Place - Inter-Polytechnic Hackathon");
  });

  test("6. Refresh & Re-login: Logging in again retrieves the exact persisted data", async () => {
    // Perform fresh login with credentials
    const freshLogin = await request(app).post("/api/auth/login").send({
      email: "aryan.verma@subharti.org",
      password: "Student@123"
    });
    assert.equal(freshLogin.status, 200);
    const newToken = freshLogin.body.token;

    // Fetch profile with new session token
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${newToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.fullName, "Aryan K. Verma");
    assert.equal(res.body.profile.branch, "CSE");
    assert.equal(res.body.profile.semester, "Semester 4");
    assert.equal(res.body.profile.enrollmentNo, "SVSU/2026/CSE/101");
    assert.equal(res.body.profile.projects[0].title, "CollegeOS Portal");
    assert.deepEqual(res.body.profile.skills, ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"]);
  });

  test("7. Partial updates: Updating one field (bio) does NOT erase other fields", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${student1Token}`)
      .send({ bio: "New updated bio text only." });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.bio, "New updated bio text only.");

    // Verify other fields remain completely intact
    const dbProfile = await StudentProfile.findOne({ userId: student1Id });
    assert.equal(dbProfile.branch, "CSE");
    assert.equal(dbProfile.semester, "Semester 4");
    assert.equal(dbProfile.enrollmentNo, "SVSU/2026/CSE/101");
    assert.equal(dbProfile.projects.length, 1);
    assert.equal(dbProfile.education.length, 2);
    assert.equal(dbProfile.skills.length, 5);
  });

  test("8. Authorization & Isolation: Student cannot alter another student's profile", async () => {
    // Student 2 attempts to pass Student 1's ID in request
    const maliciousPayload = {
      userId: student1Id,
      studentId: student1Id,
      id: student1Id,
      fullName: "Hacked Name"
    };

    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${student2Token}`)
      .send(maliciousPayload);

    assert.equal(res.status, 200);
    // Student 2's own name is updated
    assert.equal(res.body.user.fullName, "Hacked Name");

    // Student 1's name in database was NOT altered!
    const s1InDb = await User.findById(student1Id);
    assert.equal(s1InDb.fullName, "Aryan K. Verma");
  });

  test("9. System-managed fields: Role or permissions cannot be escalated", async () => {
    const res = await request(app)
      .patch("/api/profile")
      .set("Authorization", `Bearer ${student1Token}`)
      .send({
        role: "admin",
        status: "suspended",
        verificationStatus: "rejected",
        attendancePercentage: 100
      });

    assert.equal(res.status, 200);

    const s1InDb = await User.findById(student1Id);
    assert.equal(s1InDb.role, "student"); // Unchanged
    assert.equal(s1InDb.status, "verified"); // Unchanged

    const s1ProfileInDb = await StudentProfile.findOne({ userId: student1Id });
    assert.equal(s1ProfileInDb.verificationStatus, "pending_verification"); // Unchanged
  });

  test("10. Photo Upload & Delete: Avatar upload and removal persist to MongoDB", async () => {
    // 10a. Upload Avatar
    const uploadRes = await request(app)
      .post("/api/profile/avatar")
      .set("Authorization", `Bearer ${student1Token}`)
      .attach("avatar", VALID_JPEG_BUFFER, "test_avatar.jpg");

    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.body.success, true);
    assert.ok(uploadRes.body.avatarUrl);

    // Verify stored in User document in MongoDB
    const userWithAvatar = await User.findById(student1Id);
    assert.ok(userWithAvatar.avatarUrl);
    assert.equal(userWithAvatar.avatarUrl, uploadRes.body.avatarUrl);

    // 10b. Delete Avatar
    const deleteRes = await request(app)
      .delete("/api/profile/avatar")
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);

    // Verify nullified in MongoDB
    const userAfterDelete = await User.findById(student1Id);
    assert.equal(userAfterDelete.avatarUrl, null);
    assert.equal(userAfterDelete.avatarFileId, null);
  });

  test("11. Cover Banner Upload & Delete: Cover upload and removal persist to MongoDB", async () => {
    // 11a. Upload Cover
    const uploadRes = await request(app)
      .post("/api/profile/cover")
      .set("Authorization", `Bearer ${student1Token}`)
      .attach("cover", VALID_JPEG_BUFFER, "test_cover.jpg");

    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.body.success, true);
    assert.ok(uploadRes.body.coverUrl);

    // Verify stored in User document in MongoDB
    const userWithCover = await User.findById(student1Id);
    assert.ok(userWithCover.coverUrl);
    assert.equal(userWithCover.coverUrl, uploadRes.body.coverUrl);

    // 11b. Delete Cover
    const deleteRes = await request(app)
      .delete("/api/profile/cover")
      .set("Authorization", `Bearer ${student1Token}`);

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);

    // Verify nullified in MongoDB
    const userAfterDelete = await User.findById(student1Id);
    assert.equal(userAfterDelete.coverUrl, null);
    assert.equal(userAfterDelete.coverFileId, null);
  });
});
