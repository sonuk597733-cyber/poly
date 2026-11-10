import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import User, { ALLOWED_BRANCHES } from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import AuditLog from "../models/AuditLog.js";
import { fetchRoleProfile } from "./authController.js";
import { sendTokenResponse } from "../utils/tokens.js";
import { uploadImage, deleteImage } from "../services/imageKitService.js";

const BRANCH_MAP = {
  "cse": "CSE",
  "computer science": "CSE",
  "computer science & engineering": "CSE",
  "computer science and engineering": "CSE",
  "information technology": "CSE",
  "it": "CSE",
  "mechanical": "Mechanical",
  "mechanical engineering": "Mechanical",
  "me": "Mechanical",
  "electrical": "Electrical",
  "electrical engineering": "Electrical",
  "ee": "Electrical",
  "civil": "Civil",
  "civil engineering": "Civil",
  "ce": "Civil",
  "electronics": "ECE",
  "ece": "ECE",
  "electronics & communication": "ECE",
  "electronics and communication": "ECE",
  "electronics engineering": "ECE"
};

function normalizeBranch(b) {
  if (!b || typeof b !== "string") return null;
  const clean = b.trim();
  if (ALLOWED_BRANCHES.includes(clean)) return clean;
  const mapped = BRANCH_MAP[clean.toLowerCase()];
  return mapped || null;
}

function sanitizeCollection(arr, maxItems = 25) {
  if (!Array.isArray(arr)) return undefined;
  return arr
    .filter((it) => it && typeof it === "object")
    .map((it) => ({
      title: String(it.title || "").trim().slice(0, 100),
      issuer: String(it.issuer || it.organization || it.subtitle || "").trim().slice(0, 100),
      year: String(it.year || it.date || "").trim().slice(0, 30),
      description: String(it.description || "").trim().slice(0, 500)
    }))
    .filter((it) => it.title.length > 0)
    .slice(0, maxItems);
}

function sanitizeProjects(arr, maxItems = 25) {
  if (!Array.isArray(arr)) return undefined;
  return arr
    .filter((it) => it && typeof it === "object")
    .map((it) => {
      const parsedTech = Array.isArray(it.technologies)
        ? it.technologies.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
        : Array.isArray(it.tech)
        ? it.tech.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
        : typeof it.tech === "string"
        ? it.tech.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20)
        : [];
      return {
        title: String(it.title || "").trim().slice(0, 100),
        description: String(it.description || "").trim().slice(0, 1000),
        technologies: parsedTech,
        tech: parsedTech,
        githubUrl: String(it.githubUrl || it.github || "").trim().slice(0, 200),
        liveUrl: String(it.liveUrl || it.live || it.url || "").trim().slice(0, 200),
        category: String(it.category || "Web Development").trim().slice(0, 50),
        role: String(it.role || "Lead Developer").trim().slice(0, 50),
        stars: typeof it.stars === "number" ? Math.min(5, Math.max(0, it.stars)) : 4.8,
        featured: Boolean(it.featured),
        image: String(it.image || "").trim().slice(0, 500),
        completionDate: String(it.completionDate || it.year || "").trim().slice(0, 50)
      };
    })
    .filter((it) => it.title.length > 0)
    .slice(0, maxItems);
}

function sanitizeExperience(arr, maxItems = 25) {
  if (!Array.isArray(arr)) return undefined;
  return arr
    .filter((it) => it && typeof it === "object")
    .map((it) => ({
      title: String(it.title || it.role || "").trim().slice(0, 100),
      role: String(it.role || it.title || "").trim().slice(0, 100),
      company: String(it.company || it.organization || "").trim().slice(0, 100),
      location: String(it.location || "").trim().slice(0, 100),
      duration: String(it.duration || it.period || "").trim().slice(0, 50),
      type: String(it.type || "Internship").trim().slice(0, 50),
      startDate: String(it.startDate || it.duration || "").trim().slice(0, 50),
      endDate: String(it.endDate || "Present").trim().slice(0, 50),
      description: String(it.description || "").trim().slice(0, 1000),
      skills: Array.isArray(it.skills)
        ? it.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 20)
        : []
    }))
    .filter((it) => (it.title || it.role).length > 0)
    .slice(0, maxItems);
}

function sanitizeAchievements(arr, maxItems = 25) {
  if (!Array.isArray(arr)) return undefined;
  return arr
    .filter((it) => it && typeof it === "object")
    .map((it) => ({
      title: String(it.title || it.name || "").trim().slice(0, 100),
      issuer: String(it.issuer || "Subharti University").trim().slice(0, 100),
      year: String(it.year || "2025").trim().slice(0, 30),
      description: String(it.description || "").trim().slice(0, 500),
      badge: String(it.badge || "top_student").trim().slice(0, 50),
      category: String(it.category || "Academic Excellence").trim().slice(0, 50),
      verified: Boolean(it.verified !== false)
    }))
    .filter((it) => it.title.length > 0)
    .slice(0, maxItems);
}

function sanitizeCertifications(arr, maxItems = 25) {
  if (!Array.isArray(arr)) return undefined;
  return arr
    .filter((it) => it && typeof it === "object")
    .map((it) => ({
      title: String(it.title || it.name || "").trim().slice(0, 100),
      issuer: String(it.issuer || "").trim().slice(0, 100),
      year: String(it.year || "").trim().slice(0, 30),
      description: String(it.description || "").trim().slice(0, 500),
      credentialId: String(it.credentialId || "").trim().slice(0, 100),
      credentialUrl: String(it.credentialUrl || it.url || it.link || "").trim().slice(0, 200),
      url: String(it.url || it.link || it.credentialUrl || "").trim().slice(0, 200),
      verificationStatus: String(it.verificationStatus || "verified").trim().slice(0, 30)
    }))
    .filter((it) => it.title.length > 0)
    .slice(0, maxItems);
}

function deduceAcademicYear(sem) {
  if (!sem || typeof sem !== "string") return undefined;
  const s = sem.toLowerCase();
  if (s.includes("1") || s.includes("2") || s.includes("first")) return "1st Year";
  if (s.includes("3") || s.includes("4") || s.includes("second")) return "2nd Year";
  if (s.includes("5") || s.includes("6") || s.includes("third")) return "3rd Year";
  return undefined;
}

// Ensure upload directories exist for local fallback
const uploadBaseDir = path.resolve(process.cwd(), "uploads");
const avatarDir = path.join(uploadBaseDir, "collegeos", "avatars");
const coverDir = path.join(uploadBaseDir, "collegeos", "covers");
const documentDir = path.join(uploadBaseDir, "collegeos", "documents");

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}
if (!fs.existsSync(documentDir)) {
  fs.mkdirSync(documentDir, { recursive: true });
}

/**
 * Validate image buffer magic bytes (file signature)
 * Verifies that the actual binary content matches JPEG, PNG, or WebP.
 */
export function validateBufferMagicBytes(buffer) {
  if (!buffer || buffer.length < 8) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }
  // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * Validate document buffer magic bytes (supports PDF, JPEG, PNG, WebP)
 */
export function validateDocumentBufferMagicBytes(buffer) {
  if (!buffer || buffer.length < 5) return false;

  // PDF signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return true;
  }

  // Check image formats (JPG, PNG, WebP)
  return validateBufferMagicBytes(buffer);
}

/**
 * Backwards compatibility helper for filePath validation
 */
export function validateImageMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    return validateBufferMagicBytes(buffer);
  } catch {
    return false;
  }
}

// Multer Storage Configuration: In-memory storage for high-performance direct cloud upload
const memoryStorage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Please upload JPG, PNG, or WebP image."));
  }
};

export const avatarUploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter
}).single("avatar");

export const coverUploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter
}).single("cover");

const documentFilter = (_req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported document format. Allowed formats: PDF, JPG, PNG, WebP."));
  }
};

export const documentUploadMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: documentFilter
}).single("document");

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile and role-specific records
 * @access  Private
 */
export async function getProfile(req, res, next) {
  try {
    let profile = await fetchRoleProfile(req.user._id, req.user.role);

    // If no student profile exists yet for an authenticated student, create one safely
    if (!profile && req.user.role === "student") {
      profile = await StudentProfile.create({
        userId: req.user._id,
        branch: "CSE",
        academicYear: "1st Year",
        semester: "Semester 1",
        enrollmentNo: ""
      });
    }

    let recentAuditLogs = [];
    try {
      recentAuditLogs = await AuditLog.find({ performedBy: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } catch {
      recentAuditLogs = [];
    }

    return res.status(200).json({
      success: true,
      user: req.user,
      profile: profile ? (typeof profile.toJSON === "function" ? profile.toJSON() : profile) : null,
      activities: recentAuditLogs || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/profile
 * @desc    Update allowlisted profile fields (role escalation and status mutation strictly blocked)
 * @access  Private
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const {
      fullName,
      bio,
      careerObjective,
      phone,
      headline,
      location,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      section,
      studentId,
      admissionYear,
      academicSession,
      branch,
      semester,
      academicYear,
      enrollmentNo,
      skills,
      linkedin,
      github,
      portfolio,
      website,
      education,
      tagline,
      experience,
      socialLinks,
      career,
      sgpa,
      attendancePercentage,
      projects,
      certifications,
      achievements,
      subjects,
      responsibilities,
      leadershipDetails,
      preferences
    } = req.body;

    // 1. Update allowlisted User fields
    if (typeof fullName === "string" && fullName.trim().length >= 2) {
      user.fullName = fullName.trim().slice(0, 100);
    }
    if (typeof bio === "string") {
      user.bio = bio.trim().slice(0, 500);
    }
    if (typeof phone === "string") {
      user.phone = phone.trim().slice(0, 25);
    }
    if (typeof headline === "string") {
      user.headline = headline.trim().slice(0, 120);
    }
    if (typeof location === "string") {
      user.location = location.trim().slice(0, 120);
    }
    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        user.dateOfBirth = null;
      } else {
        const d = new Date(dateOfBirth);
        if (!isNaN(d.getTime())) user.dateOfBirth = d;
      }
    }
    if (typeof gender === "string") {
      user.gender = gender.trim().slice(0, 30);
    }
    if (typeof address === "string") {
      user.address = address.trim().slice(0, 300);
    }
    if (typeof city === "string") {
      user.city = city.trim().slice(0, 100);
    }
    if (typeof state === "string") {
      user.state = state.trim().slice(0, 100);
    }
    if (typeof pincode === "string") {
      user.pincode = pincode.trim().slice(0, 20);
    }
    if (emergencyContact && typeof emergencyContact === "object") {
      user.emergencyContact = {
        name: typeof emergencyContact.name === "string" ? emergencyContact.name.trim().slice(0, 100) : user.emergencyContact?.name || "",
        relation: typeof emergencyContact.relation === "string" ? emergencyContact.relation.trim().slice(0, 50) : user.emergencyContact?.relation || "",
        phone: typeof emergencyContact.phone === "string" ? emergencyContact.phone.trim().slice(0, 25) : user.emergencyContact?.phone || ""
      };
    }
    if (preferences && typeof preferences === "object") {
      user.preferences = user.preferences || {};
      if (["dark", "light", "system"].includes(preferences.theme)) {
        user.preferences.theme = preferences.theme;
      }
      if (["comfortable", "compact"].includes(preferences.tableDensity)) {
        user.preferences.tableDensity = preferences.tableDensity;
      }
      if (typeof preferences.defaultLandingTab === "string") {
        user.preferences.defaultLandingTab = preferences.defaultLandingTab.trim().slice(0, 50);
      }
      if (typeof preferences.tablePageSize === "number" && preferences.tablePageSize > 0) {
        user.preferences.tablePageSize = Math.min(Math.max(preferences.tablePageSize, 5), 100);
      }
      if (typeof preferences.reducedMotion === "boolean") {
        user.preferences.reducedMotion = preferences.reducedMotion;
      }
      if (preferences.notifications && typeof preferences.notifications === "object") {
        user.preferences.notifications = user.preferences.notifications || {};
        const alertKeys = [
          "facultyLeaveAlerts",
          "examSubmissionAlerts",
          "nbaComplianceAlerts",
          "lowAttendanceAlerts",
          "academicRiskAlerts",
          "emailDigest"
        ];
        for (const key of alertKeys) {
          if (typeof preferences.notifications[key] === "boolean") {
            user.preferences.notifications[key] = preferences.notifications[key];
          }
        }
      }
      if (preferences.reports && typeof preferences.reports === "object") {
        user.preferences.reports = user.preferences.reports || {};
        if (["semester", "academic_year", "monthly"].includes(preferences.reports.defaultPeriod)) {
          user.preferences.reports.defaultPeriod = preferences.reports.defaultPeriod;
        }
        if (["pdf", "csv", "excel"].includes(preferences.reports.exportFormat)) {
          user.preferences.reports.exportFormat = preferences.reports.exportFormat;
        }
      }
    }
    await user.save();

    // 2. Update allowlisted Role Profile fields
    let profile = await fetchRoleProfile(user._id, user.role);

    if (!profile && user.role === "student") {
      profile = new StudentProfile({
        userId: user._id,
        branch: "CSE",
        academicYear: "1st Year",
        semester: "Semester 1"
      });
    }

    if (profile) {
      if (user.role === "student") {
        if (typeof bio === "string") {
          profile.bio = bio.trim().slice(0, 500);
        }
        if (typeof headline === "string") {
          profile.headline = headline.trim().slice(0, 120);
        }
        if (typeof location === "string") {
          profile.location = location.trim().slice(0, 120);
        }
        if (typeof branch === "string" && branch.trim()) {
          const norm = normalizeBranch(branch);
          if (norm) {
            profile.branch = norm;
          }
        }
        if (typeof semester === "string" && semester.trim()) {
          profile.semester = semester.trim().slice(0, 30);
          const derivedYear = deduceAcademicYear(profile.semester);
          if (derivedYear && !academicYear) {
            profile.academicYear = derivedYear;
          }
        }
        if (typeof academicYear === "string" && ["1st Year", "2nd Year", "3rd Year"].includes(academicYear.trim())) {
          profile.academicYear = academicYear.trim();
        }
        // Enrollment number can only be initially set if empty; cannot be tampered once assigned
        if (typeof enrollmentNo === "string" && !profile.enrollmentNo && enrollmentNo.trim()) {
          profile.enrollmentNo = enrollmentNo.trim().toUpperCase().slice(0, 50);
        }
        if (Array.isArray(skills)) {
          profile.skills = skills
            .map((s) => String(s).trim())
            .filter((s) => s.length > 0)
            .slice(0, 30);
        }
        if (typeof linkedin === "string") {
          profile.linkedin = linkedin.trim().slice(0, 200);
        }
        if (typeof github === "string") {
          profile.github = github.trim().slice(0, 200);
        }
        const port = portfolio !== undefined ? portfolio : website;
        if (typeof port === "string") {
          profile.portfolio = port.trim().slice(0, 200);
        }
        if (typeof tagline === "string") {
          profile.tagline = tagline.trim().slice(0, 160);
        }
        if (typeof sgpa === "number" && sgpa >= 0 && sgpa <= 10) {
          profile.sgpa = sgpa;
        }
        if (typeof attendancePercentage === "number" && attendancePercentage >= 0 && attendancePercentage <= 100) {
          profile.attendancePercentage = attendancePercentage;
        }
        if (typeof careerObjective === "string") {
          profile.careerObjective = careerObjective.trim().slice(0, 1000);
          profile.career = profile.career || {};
          profile.career.objective = careerObjective.trim().slice(0, 1000);
        }
        if (socialLinks && typeof socialLinks === "object") {
          profile.socialLinks = { ...(profile.socialLinks?.toObject?.() || profile.socialLinks || {}), ...socialLinks };
          if (socialLinks.linkedin) profile.linkedin = String(socialLinks.linkedin).trim().slice(0, 200);
          if (socialLinks.github) profile.github = String(socialLinks.github).trim().slice(0, 200);
          if (socialLinks.portfolio || socialLinks.website) profile.portfolio = String(socialLinks.portfolio || socialLinks.website).trim().slice(0, 200);
        }
        if (career && typeof career === "object") {
          profile.career = { ...(profile.career?.toObject?.() || profile.career || {}), ...career };
        }
        const sanitizedEdu = sanitizeCollection(education);
        if (sanitizedEdu !== undefined) {
          profile.education = sanitizedEdu;
        }
        const sanitizedProj = sanitizeProjects(projects);
        if (sanitizedProj !== undefined) {
          profile.projects = sanitizedProj;
        }
        const sanitizedExp = sanitizeExperience(experience);
        if (sanitizedExp !== undefined) {
          profile.experience = sanitizedExp;
        }
        const sanitizedCert = sanitizeCertifications(certifications);
        if (sanitizedCert !== undefined) {
          profile.certifications = sanitizedCert;
        }
        const sanitizedAch = sanitizeAchievements(achievements);
        if (sanitizedAch !== undefined) {
          profile.achievements = sanitizedAch;
        }
        if (typeof section === "string") {
          profile.section = section.trim().slice(0, 10);
        }
        if (typeof studentId === "string") {
          profile.studentId = studentId.trim().slice(0, 50);
        }
        if (typeof admissionYear === "string") {
          profile.admissionYear = admissionYear.trim().slice(0, 10);
        }
        if (typeof academicSession === "string") {
          profile.academicSession = academicSession.trim().slice(0, 20);
        }
        if (user.dateOfBirth !== undefined) {
          profile.dateOfBirth = user.dateOfBirth;
        }
        if (user.gender !== undefined) {
          profile.gender = user.gender;
        }
        if (user.address !== undefined) {
          profile.address = user.address;
        }
        if (user.city !== undefined) {
          profile.city = user.city;
        }
        if (user.state !== undefined) {
          profile.state = user.state;
        }
        if (user.pincode !== undefined) {
          profile.pincode = user.pincode;
        }
        if (user.emergencyContact) {
          profile.emergencyContact = user.emergencyContact;
        }
      } else if (user.role === "teacher") {
        if (Array.isArray(subjects)) {
          profile.subjects = subjects.map((s) => String(s).trim()).filter(Boolean).slice(0, 15);
        }
        if (typeof responsibilities === "string") {
          profile.responsibilities = responsibilities.trim();
        }
        if (typeof bio === "string") {
          profile.bio = bio.trim();
        }
      } else if (user.role === "hod") {
        if (typeof leadershipDetails === "string") {
          profile.leadershipDetails = leadershipDetails.trim();
        }
        if (typeof bio === "string") {
          profile.bio = bio.trim();
        }
      } else if (user.role === "coordinator") {
        if (typeof responsibilities === "string") {
          profile.responsibilities = responsibilities.trim();
        }
        if (typeof bio === "string") {
          profile.bio = bio.trim();
        }
      } else if (user.role === "principal") {
        if (typeof bio === "string") {
          profile.bio = bio.trim();
        }
      }

      await profile.save();
    }

    // Record Profile Update AuditLog (non-blocking)
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
    AuditLog.create({
      action: "PROFILE_UPDATE",
      performedBy: user._id,
      performerName: user.fullName,
      performerRole: user.role,
      ipAddress: clientIp,
      resourceType: "Profile",
      resourceId: user._id.toString(),
      details: { updatedKeys: Object.keys(req.body || {}) }
    }).catch((err) => console.error("[AuditLog] Profile update log error:", err.message));

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user.toJSON(),
      profile: profile ? (typeof profile.toJSON === "function" ? profile.toJSON() : profile) : null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload & update user profile picture with ImageKit permanent cloud storage
 * @access  Private
 */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please choose a JPG, PNG, or WebP picture."
      });
    }

    // Binary file signature validation (magic bytes check on in-memory buffer)
    if (!validateBufferMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "File signature validation failed. Please upload a genuine JPG, PNG, or WebP image."
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Safe extension deduction
    const ext = path.extname(req.file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".png";
    const fileName = `avatar_${user._id}_${Date.now()}${safeExt}`;

    // Upload to ImageKit permanent cloud CDN with automatic local fallback
    const result = await uploadImage({
      buffer: req.file.buffer,
      fileName,
      folder: "/collegeos/avatars",
      tags: ["avatar", user.role, user._id.toString()]
    });

    // Clean up previous custom avatar from cloud/disk
    if (user.avatarFileId || user.avatarUrl) {
      await deleteImage(user.avatarFileId, user.avatarUrl);
    }

    user.avatarUrl = result.url;
    user.avatarFileId = result.fileId;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      avatarUrl: result.url,
      avatarFileId: result.fileId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/profile/cover
 * @desc    Upload & update user cover banner photo with ImageKit permanent cloud storage
 * @access  Private
 */
export async function uploadCover(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Please choose a JPG, PNG, or WebP picture."
      });
    }

    // Binary file signature validation (magic bytes check)
    if (!validateBufferMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "File signature validation failed. Please upload a genuine JPG, PNG, or WebP image."
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const ext = path.extname(req.file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const fileName = `cover_${user._id}_${Date.now()}${safeExt}`;

    const result = await uploadImage({
      buffer: req.file.buffer,
      fileName,
      folder: "/collegeos/covers",
      tags: ["cover", user.role, user._id.toString()]
    });

    // Clean up previous custom cover from cloud/disk
    if (user.coverFileId || user.coverUrl) {
      await deleteImage(user.coverFileId, user.coverUrl);
    }

    user.coverUrl = result.url;
    user.coverFileId = result.fileId;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Cover photo updated successfully.",
      coverUrl: result.url,
      coverFileId: result.fileId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Delete user profile avatar photo
 * @access  Private
 */
export async function deleteAvatar(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.avatarFileId || user.avatarUrl) {
      await deleteImage(user.avatarFileId, user.avatarUrl);
      user.avatarUrl = null;
      user.avatarFileId = null;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully.",
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/profile/cover
 * @desc    Delete user cover banner photo
 * @access  Private
 */
export async function deleteCover(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.coverFileId || user.coverUrl) {
      await deleteImage(user.coverFileId, user.coverUrl);
      user.coverUrl = null;
      user.coverFileId = null;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: "Cover photo removed successfully.",
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/students
 * @desc    Get all students with academic ledger info for teacher/staff dashboards
 * @access  Private (Staff only: teacher, hod, coordinator, principal, admin)
 */
export async function getStudentsForStaff(req, res, next) {
  try {
    const allowedRoles = ["teacher", "hod", "coordinator", "principal", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to view student rosters.`
      });
    }

    const students = await User.find({ role: "student" })
      .select("fullName email avatarUrl coverUrl bio phone status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const roster = students.map((s) => {
      const p = profileMap.get(s._id.toString());
      return {
        id: s._id.toString(),
        fullName: s.fullName,
        email: s.email,
        avatarUrl: s.avatarUrl || null,
        coverUrl: s.coverUrl || null,
        status: s.status,
        bio: s.bio || p?.bio || "",
        phone: s.phone || "",
        branch: p?.branch || "CSE",
        academicYear: p?.academicYear || "1st Year",
        semester: p?.semester || "Semester 1",
        enrollmentNo: p?.enrollmentNo || "N/A",
        attendancePercentage: p?.attendancePercentage ?? 85,
        skills: p?.skills || [],
        createdAt: s.createdAt
      };
    });

    return res.status(200).json({
      success: true,
      count: roster.length,
      students: roster
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/students/:id
 * @desc    Get detailed student profile by ID for staff
 * @access  Private (Staff only)
 */
export async function getStudentByIdForStaff(req, res, next) {
  try {
    const allowedRoles = ["teacher", "hod", "coordinator", "principal", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to view student records.`
      });
    }

    const student = await User.findOne({ _id: req.params.id, role: "student" })
      .select("fullName email avatarUrl coverUrl bio phone status createdAt")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found."
      });
    }

    const profile = await StudentProfile.findOne({ userId: student._id }).lean();

    return res.status(200).json({
      success: true,
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        avatarUrl: student.avatarUrl || null,
        coverUrl: student.coverUrl || null,
        status: student.status,
        bio: student.bio || profile?.bio || "",
        phone: student.phone || "",
        branch: profile?.branch || "CSE",
        academicYear: profile?.academicYear || "1st Year",
        semester: profile?.semester || "Semester 1",
        enrollmentNo: profile?.enrollmentNo || "N/A",
        attendancePercentage: profile?.attendancePercentage ?? 85,
        skills: profile?.skills || [],
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/profile/change-password
 * @desc    Change authenticated user's password requiring verified current password
 *          Invalidates old sessions and issues fresh credentials.
 * @access  Private
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both your current password and a new password."
      });
    }

    // Password policy check
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."
      });
    }

    // Query user with passwordHash
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match our records."
      });
    }

    // Check if new password is identical to current
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your existing password."
      });
    }

    // Hash and save new password, invalidate prior sessions
    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
    AuditLog.create({
      action: "PASSWORD_CHANGE",
      performedBy: user._id,
      performerName: user.fullName,
      performerRole: user.role,
      ipAddress: clientIp,
      resourceType: "Security",
      resourceId: user._id.toString(),
      details: { timestamp: new Date() }
    }).catch((err) => console.error("[AuditLog] Password change log error:", err.message));

    return sendTokenResponse(user, 200, res, "Password changed successfully.");
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/profile/documents
 * @desc    Upload institutional verification document (PDF, JPG, PNG, WebP)
 * @access  Private
 */
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No document file provided. Please choose a PDF, JPG, PNG, or WebP document."
      });
    }

    if (!validateDocumentBufferMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "File signature validation failed. Please upload a genuine PDF, JPG, PNG, or WebP file."
      });
    }

    let profile = await fetchRoleProfile(req.user._id, req.user.role);
    if (!profile && req.user.role === "student") {
      profile = await StudentProfile.create({
        userId: req.user._id,
        branch: "CSE",
        academicYear: "1st Year",
        semester: "Semester 1"
      });
    }
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile record not found." });
    }

    const ext = path.extname(req.file.originalname || "").toLowerCase();
    const safeExt = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".pdf";
    const fileName = `doc_${req.user._id}_${Date.now()}${safeExt}`;

    const result = await uploadImage({
      buffer: req.file.buffer,
      fileName,
      folder: "/collegeos/documents",
      tags: ["document", req.user.role, req.user._id.toString()]
    });

    const docName = typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim().slice(0, 100)
      : path.basename(req.file.originalname, ext);

    const docType = typeof req.body.type === "string" && req.body.type.trim()
      ? req.body.type.trim().slice(0, 50)
      : "ID Proof";

    const newDoc = {
      name: docName,
      type: docType,
      fileUrl: result.url,
      fileId: result.fileId,
      fileName: req.file.originalname,
      fileSize: req.file.buffer.length,
      mimeType: req.file.mimetype,
      verificationStatus: "pending_verification",
      uploadedAt: new Date()
    };

    if (!Array.isArray(profile.documents)) {
      profile.documents = [];
    }
    profile.documents.push(newDoc);
    await profile.save();

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
    AuditLog.create({
      action: "DOCUMENT_UPLOAD",
      performedBy: req.user._id,
      performerName: req.user.fullName,
      performerRole: req.user.role,
      ipAddress: clientIp,
      resourceType: "Document",
      resourceId: profile.documents[profile.documents.length - 1]._id.toString(),
      details: { name: docName, type: docType, fileName: req.file.originalname }
    }).catch((err) => console.error("[AuditLog] Doc upload error:", err.message));

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document: profile.documents[profile.documents.length - 1]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/documents
 * @desc    Get all verification documents for authenticated user
 * @access  Private
 */
export async function getDocuments(req, res, next) {
  try {
    const profile = await fetchRoleProfile(req.user._id, req.user.role);
    return res.status(200).json({
      success: true,
      documents: profile?.documents || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/documents/:id/download
 * @desc    Download institutional verification document with original attachment header
 * @access  Private
 */
export async function downloadDocument(req, res, next) {
  try {
    const profile = await fetchRoleProfile(req.user._id, req.user.role);
    if (!profile || !Array.isArray(profile.documents)) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const doc = profile.documents.id?.(req.params.id) || profile.documents.find((d) => d._id?.toString() === req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (doc.fileUrl.startsWith("/uploads/")) {
      const relativePart = doc.fileUrl.replace(/^\/uploads\//, "");
      const filePath = path.resolve(process.cwd(), "uploads", relativePart);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, doc.fileName || doc.name);
      }
    }

    return res.redirect(doc.fileUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   DELETE /api/profile/documents/:id
 * @desc    Delete user verification document
 * @access  Private
 */
export async function deleteDocument(req, res, next) {
  try {
    const profile = await fetchRoleProfile(req.user._id, req.user.role);
    if (!profile || !Array.isArray(profile.documents)) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const docIndex = profile.documents.findIndex((d) => d._id?.toString() === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const [deletedDoc] = profile.documents.splice(docIndex, 1);
    await profile.save();

    if (deletedDoc?.fileId || deletedDoc?.fileUrl) {
      deleteImage(deletedDoc.fileId, deletedDoc.fileUrl).catch((err) =>
        console.error("[DeleteDoc] Asset removal error:", err.message)
      );
    }

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
    AuditLog.create({
      action: "DOCUMENT_DELETE",
      performedBy: req.user._id,
      performerName: req.user.fullName,
      performerRole: req.user.role,
      ipAddress: clientIp,
      resourceType: "Document",
      resourceId: req.params.id,
      details: { name: deletedDoc.name }
    }).catch((err) => console.error("[AuditLog] Doc delete error:", err.message));

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/security
 * @desc    Get account security status, last login, and login history
 * @access  Private
 */
export async function getSecurityInfo(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .select("email isEmailVerified lastLoginAt passwordChangedAt loginHistory preferences")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      security: {
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt,
        loginHistory: user.loginHistory || [],
        notifications: user.preferences?.notifications || {
          emailNotifications: true,
          inAppNotifications: true,
          smsNotifications: false,
          whatsappNotifications: false
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/profile/activity
 * @desc    Get recent account and profile activity audit logs
 * @access  Private
 */
export async function getActivityLogs(req, res, next) {
  try {
    const activities = await AuditLog.find({ performedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      activities: activities.map((a) => ({
        id: a._id.toString(),
        action: a.action,
        ipAddress: a.ipAddress,
        resourceType: a.resourceType,
        details: a.details,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/profile/notifications
 * @desc    Update notification preference toggles
 * @access  Private
 */
export async function updateNotificationPreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.preferences = user.preferences || {};
    user.preferences.notifications = user.preferences.notifications || {};

    const allowedKeys = [
      "emailNotifications",
      "inAppNotifications",
      "smsNotifications",
      "whatsappNotifications",
      "facultyLeaveAlerts",
      "examSubmissionAlerts",
      "nbaComplianceAlerts",
      "lowAttendanceAlerts",
      "academicRiskAlerts",
      "emailDigest"
    ];

    const input = req.body.notifications || req.body;
    for (const key of allowedKeys) {
      if (typeof input[key] === "boolean") {
        user.preferences.notifications[key] = input[key];
      }
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully.",
      notifications: user.preferences.notifications
    });
  } catch (error) {
    next(error);
  }
}
