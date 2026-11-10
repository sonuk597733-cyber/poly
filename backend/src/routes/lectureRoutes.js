import { Router } from "express";
import {
  getLectures,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
  saveWatchProgress,
  getStudentWatchHistory,
  downloadLectureResource,
  getLectureAnalytics,
  getSingleLectureAnalytics,
  streamLectureVideo,
  uploadLectureDocuments
} from "../controllers/lectureController.js";
import {
  initChunkUpload,
  uploadChunk,
  getChunkUploadStatus,
  completeChunkUpload
} from "../controllers/lectureChunkController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { lectureUpload, lectureChunkUpload } from "../middleware/lectureUploadMiddleware.js";

const router = Router();

// All lecture routes require authentication
router.use(protect);

// 1. Resumable chunked upload endpoints (for large videos up to 600 MB)
router.post(
  "/upload/init",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  initChunkUpload
);
router.post(
  "/upload/chunk",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  lectureChunkUpload,
  uploadChunk
);
router.post(
  "/upload/complete",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  completeChunkUpload
);
router.get(
  "/upload/status/:uploadId",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getChunkUploadStatus
);
router.post(
  "/upload/documents",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  lectureUpload,
  uploadLectureDocuments
);

// 2. Specific non-param routes
router.get("/student/history", authorize("student"), getStudentWatchHistory);
router.get(
  "/analytics/overview",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getLectureAnalytics
);

// 3. Main collection routes
router.get("/", getLectures);
router.post(
  "/",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  lectureUpload,
  createLecture
);

// 4. Document-specific routes
router.get(
  "/:id/analytics",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  getSingleLectureAnalytics
);
router.get("/:id", getLectureById);
router.put(
  "/:id",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  lectureUpload,
  updateLecture
);
router.delete(
  "/:id",
  authorize("teacher", "coordinator", "hod", "principal", "admin"),
  deleteLecture
);

// 5. Progress, downloads and secure streaming
router.post("/:id/progress", saveWatchProgress);
router.get("/:id/stream", streamLectureVideo);
router.get("/:id/download/:resourceId?", downloadLectureResource);

export default router;
