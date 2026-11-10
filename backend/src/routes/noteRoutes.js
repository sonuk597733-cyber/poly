import { Router } from "express";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  previewNote,
  downloadNote,
  getStudentStatistics,
  getStudentDownloaded,
  getSingleNoteAnalytics,
  getNotesAnalyticsOverview
} from "../controllers/noteController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { noteUpload } from "../middleware/noteUploadMiddleware.js";

const router = Router();

// Protect all routes with JWT authentication
router.use(protect);

// Student specific endpoints (must be defined before /:id parameter)
router.get("/student/statistics", getStudentStatistics);
router.get("/student/downloaded", getStudentDownloaded);

// Analytics endpoints
router.get(
  "/analytics/overview",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getNotesAnalyticsOverview
);
router.get(
  "/:id/analytics",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getSingleNoteAnalytics
);

// Preview and Download endpoints
router.get("/:id/preview", previewNote);
router.get("/:id/download", downloadNote);

// Standard CRUD endpoints
router.get("/", getNotes);
router.get("/:id", getNoteById);

router.post(
  "/",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  noteUpload,
  createNote
);

router.put(
  "/:id",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  noteUpload,
  updateNote
);

router.delete(
  "/:id",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  deleteNote
);

export default router;
