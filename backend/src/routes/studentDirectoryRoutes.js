import { Router } from "express";
import {
  getStudentsDirectory,
  getStudentPublicProfile,
  deactivateStudent,
  reactivateStudent
} from "../controllers/studentDirectoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

// All student directory routes require authentication
router.use(protect);

/**
 * GET /api/students
 * All authenticated roles can access the directory.
 * Fields returned are filtered server-side based on caller's role.
 */
router.get("/", getStudentsDirectory);

/**
 * GET /api/students/:id/public
 * Any authenticated user can view a student's public/permitted profile.
 * Academic details shown only when caller is staff or viewing own profile.
 */
router.get("/:id/public", getStudentPublicProfile);

/**
 * DELETE /api/students/:id
 * ONLY principal and admin may deactivate a student.
 * Enforced by authorize() middleware AND double-checked in controller.
 * This performs a soft-delete (status = "suspended"), preserving academic records.
 */
router.delete(
  "/:id",
  authorize("principal", "admin"),
  deactivateStudent
);

/**
 * PATCH /api/students/:id/reactivate
 * ONLY principal and admin may reactivate a suspended student.
 */
router.patch(
  "/:id/reactivate",
  authorize("principal", "admin"),
  reactivateStudent
);

export default router;
