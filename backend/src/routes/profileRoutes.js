import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  avatarUploadMiddleware,
  uploadCover,
  coverUploadMiddleware,
  deleteAvatar,
  deleteCover,
  getStudentsForStaff,
  getStudentByIdForStaff,
  changePassword,
  uploadDocument,
  documentUploadMiddleware,
  getDocuments,
  downloadDocument,
  deleteDocument,
  getSecurityInfo,
  getActivityLogs,
  updateNotificationPreferences
} from "../controllers/profileController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { recoveryLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/avatar", avatarUploadMiddleware, uploadAvatar);
router.delete("/avatar", deleteAvatar);
router.post("/cover", coverUploadMiddleware, uploadCover);
router.delete("/cover", deleteCover);
router.post("/change-password", recoveryLimiter, changePassword);

// Document Management Endpoints
router.get("/documents", getDocuments);
router.post("/documents", documentUploadMiddleware, uploadDocument);
router.get("/documents/:id/download", downloadDocument);
router.delete("/documents/:id", deleteDocument);

// Security, Activity & Preferences Endpoints
router.get("/security", getSecurityInfo);
router.get("/activity", getActivityLogs);
router.patch("/notifications", updateNotificationPreferences);

// Teacher and Staff Student Roster Endpoints
router.get(
  "/students",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  getStudentsForStaff
);
router.get(
  "/students/:id",
  authorize("teacher", "hod", "coordinator", "principal", "admin"),
  getStudentByIdForStaff
);

export default router;
