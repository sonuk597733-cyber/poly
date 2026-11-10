import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { assignmentUpload } from "../middleware/assignmentUploadMiddleware.js";
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  unpublishAssignment,
  archiveAssignment,
  duplicateAssignment,
  removeReferenceAttachment,
  exportAssignmentReportCSV,
  submitAssignment,
  evaluateSubmission,
  downloadReferenceFile,
  downloadSubmissionFile,
  getAssignmentAnalytics
} from "../controllers/assignmentController.js";

const router = express.Router();

// All assignment operations require active JWT authentication
router.use(protect);

// 1. Core Assignment List, Analytics & CSV Export
router.get("/", getAssignments);
router.get("/analytics", getAssignmentAnalytics);
router.get("/report/export-csv", exportAssignmentReportCSV);

// 2. Single Assignment Inspection
router.get("/:id", getAssignmentById);

// 3. Faculty Lifecycle Actions
router.post("/", assignmentUpload, createAssignment);
router.put("/:id", assignmentUpload, updateAssignment);
router.delete("/:id", deleteAssignment);

router.post("/:id/publish", publishAssignment);
router.post("/:id/unpublish", unpublishAssignment);
router.post("/:id/archive", archiveAssignment);
router.post("/:id/duplicate", duplicateAssignment);
router.delete("/:id/attachments/:fileId", removeReferenceAttachment);

// 4. Student Coursework Submission
router.post("/:id/submit", assignmentUpload, submitAssignment);

// 5. Faculty Evaluation & Grading
router.post("/:id/grade", evaluateSubmission);
router.patch("/:id/grade", evaluateSubmission);

// 6. Secure Binary Deliverable Downloads
router.get("/:id/download-reference/:fileId", downloadReferenceFile);
router.get("/:id/download-submission/:submissionId/:fileId", downloadSubmissionFile);

export default router;
