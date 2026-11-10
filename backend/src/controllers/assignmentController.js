import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Notification from "../models/Notification.js";
import { computeFileChecksum } from "../middleware/assignmentUploadMiddleware.js";
import { resolveUploadFile } from "../utils/uploadPaths.js";
import { validateExternalUrl } from "../utils/urlSecurity.js";
import {
  getDepartmentQueryFilter,
  getSemesterQueryFilter,
  isSameSemester,
  isSameBranch
} from "../utils/validators.js";

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */

function generateReceiptId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SUB-${dateStr}-${randomPart}`;
}

async function resolveStudentScope(user) {
  let branch = user.branch;
  let semester = user.semester;

  if (!branch || !semester) {
    const prof = await StudentProfile.findOne({ userId: user._id }).lean();
    if (prof) {
      branch = branch || prof.branch;
      semester = semester || prof.semester;
    }
  }

  return {
    branch: branch || "CSE",
    semester: semester || "Semester 5"
  };
}

/* ==========================================================================
   1. GET ASSIGNMENTS (MULTI-ROLE WITH RICH METRICS)
   ========================================================================== */
export async function getAssignments(req, res, next) {
  try {
    const user = req.user;
    const { branch, semester, subject, status, category, priority, sortBy = "dueDateAsc" } = req.query;

    let query = {};

    if (user.role === "student") {
      const scope = await resolveStudentScope(user);
      query.branch = getDepartmentQueryFilter(scope.branch).queryFilter;
      query.semester = getSemesterQueryFilter(scope.semester).queryFilter;
      query.status = { $in: ["published", "closed"] }; // Students only see published or closed assignments
      query.isArchived = { $ne: true };
    } else if (user.role === "teacher") {
      // Teachers see assignments created by them or for their department
      query.$or = [{ createdBy: user._id }, { branch: user.department || user.branch || "CSE" }];
      if (status === "archived") {
        query.isArchived = true;
      } else if (!status || status === "all") {
        query.isArchived = { $ne: true };
      } else {
        query.status = status;
        query.isArchived = { $ne: true };
      }
    } else if (user.role === "coordinator" || user.role === "hod") {
      if (branch && branch !== "ALL" && branch !== "all") {
        query.branch = getDepartmentQueryFilter(branch).queryFilter;
      } else if (!branch && user.department && user.role === "hod") {
        query.branch = getDepartmentQueryFilter(user.department).queryFilter;
      }
      if (status === "archived") {
        query.isArchived = true;
      } else if (!status || status === "all") {
        query.isArchived = { $ne: true };
      } else {
        query.status = status;
        query.isArchived = { $ne: true };
      }
    }

    // Optional query filters
    if (branch && branch !== "ALL" && branch !== "all" && user.role !== "student") {
      query.branch = getDepartmentQueryFilter(branch).queryFilter;
    }
    if (branch === "ALL" || branch === "all") delete query.branch;
    if (semester && user.role !== "student") {
      query.semester = getSemesterQueryFilter(semester).queryFilter;
    }
    if (subject && subject !== "all") query.subject = subject;
    if (category && category !== "all") query.category = category;
    if (priority && priority !== "all") query.priority = priority;

    // Sorting
    let sortObj = { dueDate: 1 };
    if (sortBy === "dueDateDesc") sortObj = { dueDate: -1 };
    else if (sortBy === "newest") sortObj = { createdAt: -1 };
    else if (sortBy === "priority") sortObj = { priority: -1, dueDate: 1 };

    const assignments = await Assignment.find(query)
      .populate("createdBy", "fullName email role designation avatar")
      .sort(sortObj)
      .lean();

    const now = new Date();

    // Map and annotate student-specific submission metrics
    const formatted = assignments.map((asgn) => {
      const userSub = (asgn.submissions || []).find(
        (s) => s.studentId && s.studentId.toString() === user._id.toString()
      );

      const isDuePassed = asgn.dueDate && new Date(asgn.dueDate) < now;
      let effectiveStatus = "pending";

      if (userSub) {
        effectiveStatus = userSub.status;
      } else if (isDuePassed) {
        effectiveStatus = "overdue";
      }

      const totalSubmissions = (asgn.submissions || []).length;
      const evaluatedCount = (asgn.submissions || []).filter(
        (s) => s.status === "evaluated"
      ).length;
      const pendingEvaluationCount = totalSubmissions - evaluatedCount;

      let studentSub = null;
      if (userSub) {
        studentSub = { ...userSub };
        delete studentSub.privateRemarks; // Mask private faculty remarks from student
      }

      return {
        ...asgn,
        id: asgn._id.toString(),
        submissions: user.role === "student" ? (studentSub ? [studentSub] : []) : asgn.submissions,
        isSubmitted: Boolean(userSub && userSub.status !== "draft"),
        isDraft: Boolean(userSub && userSub.status === "draft"),
        isOverdue: !userSub && isDuePassed,
        effectiveStatus,
        userSubmission: studentSub,
        submissionsCount: totalSubmissions,
        evaluatedCount,
        pendingEvaluationCount
      };
    });

    // Compute library summary statistics
    let stats = {
      total: formatted.length,
      pending: formatted.filter((a) => a.effectiveStatus === "pending").length,
      submitted: formatted.filter((a) =>
        ["submitted", "late", "under_review", "resubmitted"].includes(a.effectiveStatus)
      ).length,
      evaluated: formatted.filter((a) => a.effectiveStatus === "evaluated").length,
      correctionRequired: formatted.filter((a) => a.effectiveStatus === "correction_required").length,
      overdue: formatted.filter((a) => a.effectiveStatus === "overdue").length,
      upcomingDeadlines: formatted.filter((a) => {
        if (a.isSubmitted || !a.dueDate) return false;
        const diffHours = (new Date(a.dueDate) - now) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 72; // due in next 3 days
      }).length
    };

    return res.status(200).json({
      success: true,
      count: formatted.length,
      statistics: stats,
      assignments: formatted
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   2. GET SINGLE ASSIGNMENT DETAILS
   ========================================================================== */
export async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id)
      .populate("createdBy", "fullName email role designation avatar")
      .populate("submissions.studentId", "fullName email rollNumber enrollmentNumber avatar branch semester")
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const now = new Date();
    const isDuePassed = assignment.dueDate && new Date(assignment.dueDate) < now;

    if (user.role === "student") {
      const scope = await resolveStudentScope(user);
      const branchMatch = isSameBranch(assignment.branch, scope.branch);
      const semMatch = isSameSemester(assignment.semester, scope.semester);
      if (
        assignment.status === "draft" ||
        assignment.isArchived ||
        !branchMatch ||
        !semMatch
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this coursework assignment."
        });
      }

      // Find current student's submission
      const rawUserSub = (assignment.submissions || []).find(
        (s) => s.studentId && (s.studentId._id || s.studentId).toString() === user._id.toString()
      );

      let userSub = null;
      if (rawUserSub) {
        userSub = { ...rawUserSub };
        delete userSub.privateRemarks; // Never reveal private faculty notes to student
      }

      // Mask other students' submissions for privacy
      assignment.submissions = userSub ? [userSub] : [];
      assignment.userSubmission = userSub || null;
      assignment.effectiveStatus = userSub
        ? userSub.status
        : isDuePassed
        ? "overdue"
        : "pending";
    } else if (user.role === "coordinator" || user.role === "hod") {
      const allowedDept = user.department || user.branch;
      if (allowedDept && assignment.branch !== allowedDept) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access coursework from another department."
        });
      }
    } else if (user.role === "teacher") {
      const isCreator = assignment.createdBy && (assignment.createdBy._id || assignment.createdBy).toString() === user._id.toString();
      const teacherDept = user.department || user.branch || "CSE";
      if (!isCreator && assignment.branch !== teacherDept) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view coursework outside your department."
        });
      }
    }

    return res.status(200).json({
      success: true,
      assignment: {
        ...assignment,
        id: assignment._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   3. CREATE ASSIGNMENT (STAFF ONLY)
   ========================================================================== */
export async function createAssignment(req, res, next) {
  try {
    const user = req.user;

    if (!["teacher", "coordinator", "hod", "principal", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only authorized faculty members can create coursework assignments."
      });
    }

    const {
      title,
      shortDescription,
      description,
      branch,
      academicYear,
      semester,
      section = "All",
      subject,
      subjectCode = "",
      unit = "",
      chapter = "",
      category = "Lab Assignment",
      type = "individual",
      priority = "normal",
      status = "published",
      totalPoints = 100,
      passingMarks = 40,
      dueDate,
      dueTime = "23:59",
      lateSubmissionPolicy = "allowed_penalty",
      latePenaltyPercent = 10,
      maxFileSizeMB = 50,
      allowedFileFormats = [".pdf", ".docx", ".zip", ".png", ".jpg"]
    } = req.body;

    if (!title || !description || !branch || !semester || !subject || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (title, description, branch, semester, subject, and deadline)."
      });
    }

    // Process uploaded reference attachment files (if any)
    const referenceAttachments = [];
    const files = req.files?.referenceFiles || req.files?.files || [];
    for (const f of files) {
      const checksum = computeFileChecksum(f.path);
      referenceAttachments.push({
        fileName: f.filename,
        originalFileName: f.originalname,
        fileUrl: `/uploads/assignments/references/${f.filename}`,
        fileSize: f.size,
        fileExtension: path.extname(f.originalname).toLowerCase(),
        mimeType: f.mimetype,
        checksum
      });
    }

    // Parse external resources if provided as JSON string
    let parsedExternalResources = [];
    if (req.body.externalResources) {
      try {
        const raw = typeof req.body.externalResources === "string"
          ? JSON.parse(req.body.externalResources)
          : req.body.externalResources;

        if (Array.isArray(raw)) {
          for (const item of raw) {
            if (item.url) {
              const check = validateExternalUrl(item.url);
              if (!check.valid) {
                return res.status(400).json({
                  success: false,
                  message: `Invalid external resource URL (${item.url}): ${check.reason}`
                });
              }
              parsedExternalResources.push({
                title: (item.title || "External Resource").trim(),
                url: item.url.trim(),
                provider: item.provider || "website",
                description: (item.description || "").trim()
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not parse externalResources JSON:", err.message);
      }
    }

    // Parse rubric criteria if provided as JSON string
    let parsedRubricCriteria = [];
    if (req.body.rubricCriteria) {
      try {
        const raw = typeof req.body.rubricCriteria === "string"
          ? JSON.parse(req.body.rubricCriteria)
          : req.body.rubricCriteria;

        if (Array.isArray(raw)) {
          parsedRubricCriteria = raw.map((r) => ({
            title: r.title.trim(),
            maxPoints: Number(r.maxPoints) || 10,
            description: (r.description || "").trim()
          }));
        }
      } catch (err) {
        console.warn("Could not parse rubricCriteria JSON:", err.message);
      }
    }

    const combinedDue = new Date(dueDate);
    if (dueTime && dueTime.includes(":")) {
      const [hh, mm] = dueTime.split(":");
      combinedDue.setHours(Number(hh) || 23, Number(mm) || 59, 0, 0);
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      shortDescription: (shortDescription || "").trim(),
      description: description.trim(),
      branch,
      academicYear: academicYear || "1st Year",
      semester,
      section,
      subject: subject.trim(),
      subjectCode: subjectCode.trim(),
      unit: unit.trim(),
      chapter: chapter.trim(),
      category,
      type,
      priority,
      status,
      totalPoints: Number(totalPoints) || 100,
      maxMarks: Number(totalPoints) || 100,
      passingMarks: Number(passingMarks) || 40,
      dueDate: combinedDue,
      dueTime,
      lateSubmissionPolicy,
      latePenaltyPercent: Number(latePenaltyPercent) || 10,
      maxFileSizeMB: Number(maxFileSizeMB) || 50,
      allowedFileFormats: Array.isArray(allowedFileFormats) ? allowedFileFormats : [".pdf", ".docx", ".zip"],
      referenceAttachments,
      externalResources: parsedExternalResources,
      rubricCriteria: parsedRubricCriteria,
      createdBy: user._id,
      creatorRole: user.role,
      creatorName: user.fullName || "Course Faculty",
      publishedAt: status === "published" ? new Date() : null,
      submissions: []
    });

    // Notify enrolled students asynchronously if published
    if (status === "published") {
      try {
        const studentQuery = { role: "student", branch, semester };
        const eligibleStudents = await User.find(studentQuery).select("_id").lean();

        if (eligibleStudents.length > 0) {
          const notifs = eligibleStudents.map((s) => ({
            recipientId: s._id,
            recipientRole: "student",
            title: `New Assignment Published: ${assignment.title}`,
            message: `${user.fullName} uploaded a new ${assignment.category} for ${assignment.subject}. Due date: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            type: "info",
            link: `#/dashboard/assignments`
          }));
          await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
        }
      } catch (notifErr) {
        console.warn("Failed to dispatch assignment notifications:", notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Assignment created and distributed successfully.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   4. UPDATE ASSIGNMENT
   ========================================================================== */
export async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }



    // Role verification: creator, coordinator of branch, HOD of department, or admin
    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isBranchAuth = ["coordinator", "hod", "principal", "admin"].includes(user.role);

    if (!isCreator && !isBranchAuth) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this assignment."
      });
    }

    const {
      title,
      shortDescription,
      description,
      branch,
      academicYear,
      semester,
      section,
      subject,
      subjectCode,
      unit,
      chapter,
      category,
      type,
      priority,
      status,
      totalPoints,
      passingMarks,
      dueDate,
      dueTime,
      lateSubmissionPolicy,
      latePenaltyPercent,
      maxFileSizeMB,
      allowedFileFormats,
      removedAttachmentIds
    } = req.body;

    const wasDraft = assignment.status === "draft";

    if (title) assignment.title = title.trim();
    if (shortDescription !== undefined) assignment.shortDescription = shortDescription.trim();
    if (description) assignment.description = description.trim();
    if (branch) assignment.branch = branch;
    if (academicYear) assignment.academicYear = academicYear;
    if (semester) assignment.semester = semester;
    if (section !== undefined) assignment.section = section;
    if (subject) assignment.subject = subject.trim();
    if (subjectCode !== undefined) assignment.subjectCode = subjectCode.trim();
    if (unit !== undefined) assignment.unit = unit.trim();
    if (chapter !== undefined) assignment.chapter = chapter.trim();
    if (category) assignment.category = category;
    if (type) assignment.type = type;
    if (priority) assignment.priority = priority;
    if (status) assignment.status = status;
    if (lateSubmissionPolicy) assignment.lateSubmissionPolicy = lateSubmissionPolicy;
    if (latePenaltyPercent !== undefined) assignment.latePenaltyPercent = Number(latePenaltyPercent);
    if (maxFileSizeMB !== undefined) assignment.maxFileSizeMB = Number(maxFileSizeMB);

    if (totalPoints !== undefined) {
      assignment.totalPoints = Number(totalPoints);
      assignment.maxMarks = Number(totalPoints);
    }
    if (passingMarks !== undefined) {
      assignment.passingMarks = Number(passingMarks);
    }

    if (dueDate) {
      const d = new Date(dueDate);
      if (dueTime && dueTime.includes(":")) {
        const [hh, mm] = dueTime.split(":");
        d.setHours(Number(hh) || 23, Number(mm) || 59, 0, 0);
      }
      assignment.dueDate = d;
      if (dueTime) assignment.dueTime = dueTime;
    }

    // Handle removal of existing attachments if requested
    if (removedAttachmentIds) {
      let idsToRemove = [];
      try {
        idsToRemove = typeof removedAttachmentIds === "string" ? JSON.parse(removedAttachmentIds) : removedAttachmentIds;
      } catch {
        idsToRemove = [removedAttachmentIds];
      }
      if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
        assignment.referenceAttachments = assignment.referenceAttachments.filter(
          (att) => !idsToRemove.includes(att._id.toString()) && !idsToRemove.includes(att.fileName)
        );
      }
    }

    // Append newly uploaded reference files if any
    const files = req.files?.referenceFiles || req.files?.files || [];
    for (const f of files) {
      const checksum = computeFileChecksum(f.path);
      assignment.referenceAttachments.push({
        fileName: f.filename,
        originalFileName: f.originalname,
        fileUrl: `/uploads/assignments/references/${f.filename}`,
        fileSize: f.size,
        fileExtension: path.extname(f.originalname).toLowerCase(),
        mimeType: f.mimetype,
        checksum
      });
    }

    // Update external resources if provided
    if (req.body.externalResources) {
      try {
        const raw = typeof req.body.externalResources === "string" ? JSON.parse(req.body.externalResources) : req.body.externalResources;
        if (Array.isArray(raw)) {
          const validResources = [];
          for (const item of raw) {
            if (item.url) {
              const check = validateExternalUrl(item.url);
              if (check.valid) {
                validResources.push({
                  title: (item.title || "External Resource").trim(),
                  url: item.url.trim(),
                  provider: item.provider || "website",
                  description: (item.description || "").trim()
                });
              }
            }
          }
          assignment.externalResources = validResources;
        }
      } catch (err) {
        console.warn("Could not parse externalResources on update:", err.message);
      }
    }

    // Update rubric criteria if provided
    if (req.body.rubricCriteria) {
      try {
        const raw = typeof req.body.rubricCriteria === "string" ? JSON.parse(req.body.rubricCriteria) : req.body.rubricCriteria;
        if (Array.isArray(raw)) {
          assignment.rubricCriteria = raw.map((r) => ({
            title: (r.title || "").trim(),
            maxPoints: Number(r.maxPoints) || 10,
            description: (r.description || "").trim()
          }));
        }
      } catch (err) {
        console.warn("Could not parse rubricCriteria on update:", err.message);
      }
    }

    // If transitioned from draft to published, record publishedAt and notify students
    if (wasDraft && assignment.status === "published") {
      assignment.publishedAt = new Date();
      try {
        const eligibleStudents = await User.find({
          role: "student",
          branch: assignment.branch,
          semester: assignment.semester
        }).select("_id").lean();

        if (eligibleStudents.length > 0) {
          const notifs = eligibleStudents.map((s) => ({
            recipientId: s._id,
            recipientRole: "student",
            title: `New Assignment Published: ${assignment.title}`,
            message: `${user.fullName} published a new ${assignment.category} for ${assignment.subject}. Due date: ${new Date(assignment.dueDate).toLocaleDateString()}`,
            type: "info",
            link: `#/dashboard/assignments`
          }));
          await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
        }
      } catch (e) {}
    }

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5. DELETE ASSIGNMENT (WITH SAFE SUBMISSION RECORD CHECK)
   ========================================================================== */
export async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isAdminOrHOD = ["hod", "principal", "admin", "coordinator"].includes(user.role);

    if (!isCreator && !isAdminOrHOD) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this assignment."
      });
    }

    if ((user.role === "coordinator" || user.role === "hod") && !isCreator) {
      const dept = user.department || user.branch;
      if (dept && assignment.branch && dept.toLowerCase() !== assignment.branch.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `You are not authorized to delete assignments outside your department (${dept}).`
        });
      }
    }

    const realSubmissionsCount = (assignment.submissions || []).filter((s) => s.status !== "draft").length;

    // Safety check: if submissions exist and force is not confirmed, require safe archive instead
    if (realSubmissionsCount > 0 && force !== "true") {
      return res.status(400).json({
        success: false,
        hasSubmissions: true,
        submissionsCount: realSubmissionsCount,
        message: `This assignment has ${realSubmissionsCount} active student submission(s). Deletion is blocked to preserve academic grading records. Please archive the assignment instead.`
      });
    }

    // Clean up physical reference attachment files if any
    if (assignment.referenceAttachments && assignment.referenceAttachments.length > 0) {
      for (const att of assignment.referenceAttachments) {
        if (att.filePath && fs.existsSync(att.filePath)) {
          try {
            fs.unlinkSync(att.filePath);
          } catch (e) {
            console.warn("Could not delete reference attachment file:", att.filePath, e.message);
          }
        }
      }
    }

    await Assignment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Assignment removed successfully."
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5B. PUBLISH ASSIGNMENT (WITH STUDENT NOTIFICATION)
   ========================================================================== */
export async function publishAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }



    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isBranchAuth = ["coordinator", "hod", "principal", "admin"].includes(user.role);
    if (!isCreator && !isBranchAuth) {
      return res.status(403).json({ success: false, message: "Not authorized to publish this assignment." });
    }

    if (!assignment.title || !assignment.description || !assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish assignment without title, instructions, and submission deadline."
      });
    }

    assignment.status = "published";
    assignment.isArchived = false;
    assignment.publishedAt = new Date();
    await assignment.save();

    // Notify enrolled students
    try {
      const eligibleStudents = await User.find({
        role: "student",
        branch: assignment.branch,
        semester: assignment.semester
      }).select("_id").lean();

      if (eligibleStudents.length > 0) {
        const notifs = eligibleStudents.map((s) => ({
          recipientId: s._id,
          recipientRole: "student",
          title: `Assignment Published: ${assignment.title}`,
          message: `${user.fullName} published coursework for ${assignment.subject}. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
          type: "info",
          link: `#/dashboard/assignments`
        }));
        await Notification.insertMany(notifs, { ordered: false }).catch(() => {});
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: "Assignment published and distributed to enrolled students successfully.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5C. UNPUBLISH ASSIGNMENT (RETURN TO DRAFT)
   ========================================================================== */
export async function unpublishAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }



    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isBranchAuth = ["coordinator", "hod", "principal", "admin"].includes(user.role);
    if (!isCreator && !isBranchAuth) {
      return res.status(403).json({ success: false, message: "Not authorized to unpublish this assignment." });
    }

    const nonDraftSubs = (assignment.submissions || []).filter((s) => s.status !== "draft");
    if (nonDraftSubs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot unpublish an assignment with ${nonDraftSubs.length} turned-in student submission(s). Please archive or close the assignment instead.`
      });
    }

    assignment.status = "draft";
    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment returned to draft status.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5D. ARCHIVE / UNARCHIVE ASSIGNMENT
   ========================================================================== */
export async function archiveAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }



    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isBranchAuth = ["coordinator", "hod", "principal", "admin"].includes(user.role);
    if (!isCreator && !isBranchAuth) {
      return res.status(403).json({ success: false, message: "Not authorized to archive this assignment." });
    }

    const nextState = !assignment.isArchived;
    assignment.isArchived = nextState;
    assignment.status = nextState ? "archived" : "published";
    await assignment.save();

    return res.status(200).json({
      success: true,
      message: nextState ? "Assignment moved to archive." : "Assignment restored from archive.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5E. DUPLICATE ASSIGNMENT AS DRAFT
   ========================================================================== */
export async function duplicateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID format." });
    }

    const original = await Assignment.findById(id).lean();
    if (!original) {
      return res.status(404).json({ success: false, message: "Original assignment not found." });
    }

    const cloned = await Assignment.create({
      title: `${original.title} (Copy)`,
      shortDescription: original.shortDescription || "",
      description: original.description || "",
      branch: original.branch,
      academicYear: original.academicYear,
      semester: original.semester,
      section: original.section || "All",
      subject: original.subject,
      subjectCode: original.subjectCode || "",
      unit: original.unit || "",
      chapter: original.chapter || "",
      category: original.category,
      type: original.type,
      priority: original.priority,
      status: "draft",
      isArchived: false,
      totalPoints: original.totalPoints || 100,
      maxMarks: original.maxMarks || 100,
      passingMarks: original.passingMarks || 40,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
      dueTime: original.dueTime || "23:59",
      lateSubmissionPolicy: original.lateSubmissionPolicy,
      latePenaltyPercent: original.latePenaltyPercent,
      maxFileSizeMB: original.maxFileSizeMB,
      allowedFileFormats: original.allowedFileFormats,
      referenceAttachments: original.referenceAttachments || [],
      externalResources: original.externalResources || [],
      rubricCriteria: original.rubricCriteria || [],
      createdBy: user._id,
      creatorRole: user.role,
      creatorName: user.fullName,
      publishedAt: null,
      submissions: []
    });

    return res.status(201).json({
      success: true,
      message: "Assignment duplicated as a draft successfully.",
      assignment: cloned
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5F. REMOVE REFERENCE ATTACHMENT
   ========================================================================== */
export async function removeReferenceAttachment(req, res, next) {
  try {
    const { id, fileId } = req.params;
    const user = req.user;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }



    const isCreator = assignment.createdBy.toString() === user._id.toString();
    const isBranchAuth = ["coordinator", "hod", "principal", "admin"].includes(user.role);
    if (!isCreator && !isBranchAuth) {
      return res.status(403).json({ success: false, message: "Not authorized to modify attachments." });
    }

    assignment.referenceAttachments = (assignment.referenceAttachments || []).filter(
      (f) => f._id.toString() !== fileId && f.fileName !== fileId
    );

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Reference handout removed successfully.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   5G. EXPORT ASSIGNMENT ANALYTICS REPORT AS CSV
   ========================================================================== */
export async function exportAssignmentReportCSV(req, res, next) {
  try {
    const user = req.user;
    const { branch, semester } = req.query;

    const query = {};
    if (branch && branch !== "ALL" && branch !== "all") {
      query.branch = branch;
    } else if (!branch && user.department && user.role === "hod") {
      query.branch = user.department;
    }
    if (semester && semester !== "all" && semester !== "ALL") query.semester = semester;

    const targetBranch = query.branch || "All_Branches";

    const assignments = await Assignment.find(query)
      .populate("createdBy", "fullName")
      .populate("submissions.studentId", "fullName rollNumber email")
      .lean();

    const rows = [
      ["Title", "Subject", "Branch", "Semester", "Due Date", "Total Marks", "Created By", "Status", "Submissions", "Evaluated", "Avg Score"]
    ];

    for (const a of assignments) {
      const subs = a.submissions || [];
      const evaluated = subs.filter((s) => s.status === "evaluated" && s.grade !== null);
      const avgScore = evaluated.length > 0
        ? Math.round(evaluated.reduce((acc, s) => acc + s.grade, 0) / evaluated.length)
        : "—";

      rows.push([
        `"${(a.title || "").replace(/"/g, '""')}"`,
        `"${(a.subject || "").replace(/"/g, '""')}"`,
        a.branch,
        a.semester,
        a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : "",
        a.totalPoints,
        `"${(a.creatorName || a.createdBy?.fullName || "").replace(/"/g, '""')}"`,
        a.status,
        subs.length,
        evaluated.length,
        avgScore
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="assignment_analytics_${targetBranch}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   6. SUBMIT STUDENT ASSIGNMENT (OR SAVE DRAFT)
   ========================================================================== */
export async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only enrolled students can submit assignment coursework."
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    if (assignment.status === "draft" || assignment.isArchived) {
      return res.status(403).json({
        success: false,
        message: "Submissions are not permitted on unpublished or archived assignments."
      });
    }

    const scope = await resolveStudentScope(user);
    const branchMatch = isSameBranch(assignment.branch, scope.branch);
    const semMatch = isSameSemester(assignment.semester, scope.semester);
    if (!branchMatch || !semMatch) {
      return res.status(403).json({
        success: false,
        message: "You can only submit assignments assigned to your branch and semester."
      });
    }



    const {
      answerText = "",
      answerHtml = "",
      submissionText = ""
    } = req.body;

    const isDraft = req.body.isDraft === true || req.body.isDraft === "true";

    const now = new Date();
    const isDuePassed = assignment.dueDate && now > new Date(assignment.dueDate);

    // Enforce deadline rules if not a draft
    if (!isDraft && isDuePassed && assignment.lateSubmissionPolicy === "disallowed") {
      return res.status(400).json({
        success: false,
        message: "The submission deadline for this assignment has expired, and late submissions are disallowed."
      });
    }

    // Process attached submission files
    const newAttachments = [];
    const files = req.files?.submissionFiles || req.files?.files || [];
    for (const f of files) {
      const checksum = computeFileChecksum(f.path);
      newAttachments.push({
        fileName: f.filename,
        originalFileName: f.originalname,
        fileUrl: `/uploads/assignments/submissions/${f.filename}`,
        fileSize: f.size,
        fileExtension: path.extname(f.originalname).toLowerCase(),
        mimeType: f.mimetype,
        checksum
      });
    }

    // Existing submission index
    const existingIndex = assignment.submissions.findIndex(
      (s) => s.studentId && s.studentId.toString() === user._id.toString()
    );

    let status = isDraft ? "draft" : isDuePassed ? "late" : "submitted";
    let receipt = generateReceiptId();
    let version = 1;

    const finalAnswerText = (answerText || submissionText || "").trim();
    const wordCount = finalAnswerText.split(/\s+/).filter(Boolean).length;

    if (existingIndex >= 0) {
      const existingSub = assignment.submissions[existingIndex];

      if (existingSub.status === "evaluated" && !isDraft) {
        return res.status(400).json({
          success: false,
          message: "This assignment has already been evaluated and graded. Resubmissions are not permitted unless requested by faculty."
        });
      }

      // If returning for correction, archive old version and mark as resubmitted
      if (!isDraft && existingSub.status === "correction_required") {
        existingSub.previousVersions.push({
          version: existingSub.version || 1,
          submittedAt: existingSub.submittedAt,
          submissionReceipt: existingSub.submissionReceipt,
          answerText: existingSub.answerText || existingSub.submissionText,
          answerHtml: existingSub.answerHtml,
          attachments: existingSub.attachments,
          status: existingSub.status,
          feedback: existingSub.feedback
        });
        version = (existingSub.version || 1) + 1;
        status = "resubmitted";
        receipt = generateReceiptId();
      } else {
        version = existingSub.version || 1;
        receipt = isDraft ? (existingSub.submissionReceipt || receipt) : generateReceiptId();
      }

      // Merge new attachments with existing attachments if any
      const mergedAttachments = [...(existingSub.attachments || []), ...newAttachments];

      assignment.submissions[existingIndex] = {
        ...existingSub.toObject(),
        submittedAt: now,
        status,
        submissionText: finalAnswerText,
        answerText: finalAnswerText,
        answerHtml: answerHtml || existingSub.answerHtml || "",
        wordCount,
        fileUrl: mergedAttachments[0]?.fileUrl || existingSub.fileUrl || null,
        attachments: mergedAttachments,
        submissionReceipt: receipt,
        version
      };
    } else {
      assignment.submissions.push({
        studentId: user._id,
        submittedAt: now,
        status,
        submissionText: finalAnswerText,
        answerText: finalAnswerText,
        answerHtml,
        wordCount,
        fileUrl: newAttachments[0]?.fileUrl || null,
        attachments: newAttachments,
        submissionReceipt: receipt,
        version: 1,
        previousVersions: []
      });
    }

    await assignment.save();

    // Notify faculty upon real submission (not draft)
    if (!isDraft) {
      try {
        await Notification.create({
          recipientId: assignment.createdBy,
          recipientRole: "teacher",
          title: `Assignment Submission Received: ${user.fullName}`,
          message: `${user.fullName} (${user.rollNumber || "Student"}) submitted ${assignment.title} [${status.toUpperCase()}]. Receipt: ${receipt}`,
          type: "success",
          link: `#/dashboard/submissions`
        });
      } catch (err) {
        console.warn("Could not dispatch submission notification:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: isDraft
        ? "Assignment draft saved to server."
        : "Assignment solution submitted successfully!",
      receipt,
      status,
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   7. EVALUATE / GRADE SUBMISSION (OR RETURN FOR CORRECTION)
   ========================================================================== */
export async function evaluateSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!["teacher", "coordinator", "hod", "principal", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only authorized faculty can grade student submissions."
      });
    }

    const {
      studentId,
      grade,
      feedback = "",
      correctionInstructions = "",
      privateRemarks = "",
      rubricScores = [],
      action = "evaluate" // "evaluate" | "return_for_correction"
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Target studentId is required." });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }


    const isCreator = assignment.createdBy && assignment.createdBy.toString() === user._id.toString();
    if (user.role === "teacher" && !isCreator && assignment.branch !== (user.department || user.branch)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to evaluate assignments for this subject."
      });
    }

    if ((user.role === "coordinator" || user.role === "hod") && (user.department || user.branch)) {
      if (assignment.branch !== (user.department || user.branch)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to evaluate assignments outside your department."
        });
      }
    }

    const sub = assignment.submissions.find(
      (s) => s.studentId && s.studentId.toString() === studentId.toString()
    );

    if (!sub) {
      return res.status(404).json({ success: false, message: "Student submission not found." });
    }

    const now = new Date();

    if (action === "return_for_correction") {
      sub.status = "correction_required";
      sub.feedback = feedback.trim();
      sub.correctionInstructions = correctionInstructions.trim() || "Please revise your deliverables and resubmit.";
      sub.evaluatedBy = user._id;
      sub.evaluatorName = user.fullName;
      sub.evaluatedAt = now;

      await assignment.save();

      // Notify student about correction request
      try {
        await Notification.create({
          recipientId: studentId,
          recipientRole: "student",
          title: `Action Required: Assignment Returned for Correction`,
          message: `Your instructor (${user.fullName}) requested revisions on "${assignment.title}". Please review the feedback and resubmit.`,
          type: "warning",
          link: `#/dashboard/assignments`
        });
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: "Assignment returned to student for correction.",
        assignment
      });
    }

    // Standard Evaluation & Marks Awarding
    const awardedGrade = Number(grade);
    if (isNaN(awardedGrade) || awardedGrade < 0 || awardedGrade > assignment.totalPoints) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained must be between 0 and total marks (${assignment.totalPoints}).`
      });
    }

    sub.grade = awardedGrade;
    sub.percentage = Math.round((awardedGrade / assignment.totalPoints) * 100);
    sub.isPassed = awardedGrade >= assignment.passingMarks;
    sub.feedback = feedback.trim();
    sub.privateRemarks = (privateRemarks || "").trim();
    sub.rubricScores = Array.isArray(rubricScores) ? rubricScores : [];
    sub.status = "evaluated";
    sub.evaluatedBy = user._id;
    sub.evaluatorName = user.fullName;
    sub.evaluatedAt = now;
    sub.isResultPublished = true;

    await assignment.save();

    // Dispatch grade notification to student
    try {
      await Notification.create({
        recipientId: studentId,
        recipientRole: "student",
        title: `Assignment Graded: ${assignment.title}`,
        message: `Your submission for "${assignment.title}" has been evaluated by ${user.fullName}. Score: ${awardedGrade}/${assignment.totalPoints} (${sub.percentage}%).`,
        type: sub.isPassed ? "success" : "alert",
        link: `#/dashboard/assignments`
      });
    } catch (err) {}

    return res.status(200).json({
      success: true,
      message: "Submission evaluated and results published to student.",
      assignment
    });
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   8. SECURE DOWNLOAD REFERENCE MATERIAL FILE
   ========================================================================== */
export async function downloadReferenceFile(req, res, next) {
  try {
    const { id, fileId } = req.params;

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const user = req.user;
    if (user.role === "student") {
      const scope = await resolveStudentScope(user);
      if (assignment.status === "draft" || assignment.isArchived) {
        return res.status(403).json({ success: false, message: "Reference handout is not accessible." });
      }
      const branchMatch = isSameBranch(assignment.branch, scope.branch);
      const semMatch = isSameSemester(assignment.semester, scope.semester);
      if (!branchMatch || !semMatch) {
        return res.status(403).json({ success: false, message: "You are not authorized to access coursework from another academic cohort." });
      }
    } else if (user.role === "coordinator" || user.role === "hod") {
      const dept = user.department || user.branch;
      if (dept && assignment.branch !== dept) {
        return res.status(403).json({ success: false, message: "You are not authorized to access coursework from another department." });
      }
    }

    const ref = (assignment.referenceAttachments || []).find(
      (f) => f._id.toString() === fileId || f.fileName === fileId
    );

    if (!ref) {
      return res.status(404).json({ success: false, message: "Reference file attachment not found." });
    }

    const diskPath = resolveUploadFile(ref.fileName, path.join("assignments", "references"));
    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({
        success: false,
        message: "Physical reference file could not be located on server storage."
      });
    }

    const downloadName = ref.originalFileName || ref.fileName;
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader("Content-Type", ref.mimeType || "application/octet-stream");

    return res.sendFile(path.resolve(diskPath));
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   9. SECURE DOWNLOAD STUDENT SUBMISSION FILE
   ========================================================================== */
export async function downloadSubmissionFile(req, res, next) {
  try {
    const { id, submissionId, fileId } = req.params;
    const user = req.user;

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const sub = (assignment.submissions || []).find(
      (s) => s._id.toString() === submissionId
    );

    if (!sub) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    // RBAC: Only the student who submitted or authorized faculty can download the solution file
    const isOwner = sub.studentId && sub.studentId.toString() === user._id.toString();
    const isStaff = ["teacher", "coordinator", "hod", "principal", "admin"].includes(user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view this student deliverable."
      });
    }

    if (user.role === "teacher") {
      const isCreator = assignment.createdBy && assignment.createdBy.toString() === user._id.toString();
      const teacherDept = user.department || user.branch || "CSE";
      if (!isCreator && assignment.branch !== teacherDept) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to download deliverables outside your department."
        });
      }
    }

    if ((user.role === "coordinator" || user.role === "hod") && (user.department || user.branch)) {
      if (assignment.branch !== (user.department || user.branch)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to download deliverables outside your department."
        });
      }
    }

    const file = (sub.attachments || []).find(
      (f) => f._id.toString() === fileId || f.fileName === fileId
    ) || sub.attachments?.[0];

    if (!file) {
      return res.status(404).json({ success: false, message: "Attachment file not found in submission." });
    }

    const diskPath = resolveUploadFile(file.fileName, path.join("assignments", "submissions"));
    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({
        success: false,
        message: "Physical submission file could not be located on server storage."
      });
    }

    const downloadName = file.originalFileName || file.fileName;
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");

    return res.sendFile(path.resolve(diskPath));
  } catch (error) {
    next(error);
  }
}

/* ==========================================================================
   10. ASSIGNMENT ANALYTICS (FOR TEACHER / COORDINATOR / HOD)
   ========================================================================== */
export async function getAssignmentAnalytics(req, res, next) {
  try {
    const user = req.user;
    const { branch, semester } = req.query;

    let targetBranch = branch || user.department || user.branch || "CSE";

    const assignments = await Assignment.find({ branch: targetBranch })
      .populate("submissions.studentId", "fullName email rollNumber")
      .lean();

    let totalSubmissions = 0;
    let totalEvaluated = 0;
    let totalLate = 0;
    let totalMarksSum = 0;
    let marksCount = 0;
    let highestMark = 0;
    let lowestMark = 100;

    assignments.forEach((a) => {
      (a.submissions || []).forEach((s) => {
        totalSubmissions += 1;
        if (s.status === "evaluated" && s.grade !== null) {
          totalEvaluated += 1;
          totalMarksSum += s.grade;
          marksCount += 1;
          if (s.grade > highestMark) highestMark = s.grade;
          if (s.grade < lowestMark) lowestMark = s.grade;
        }
        if (s.status === "late") totalLate += 1;
      });
    });

    const averageMarks = marksCount > 0 ? Math.round(totalMarksSum / marksCount) : 0;
    const evaluationCompletionRate = totalSubmissions > 0
      ? Math.round((totalEvaluated / totalSubmissions) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      branch: targetBranch,
      analytics: {
        totalAssignments: assignments.length,
        totalSubmissions,
        totalEvaluated,
        pendingEvaluations: totalSubmissions - totalEvaluated,
        totalLate,
        averageMarks,
        highestMark: marksCount > 0 ? highestMark : 0,
        lowestMark: marksCount > 0 ? lowestMark : 0,
        evaluationCompletionRate
      }
    });
  } catch (error) {
    next(error);
  }
}
