import { Router } from "express";
import {
  getDashboardStats,
  getDashboardCharts
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Dashboard data requires authentication
router.use(protect);

router.get("/stats", getDashboardStats);
router.get("/charts", getDashboardCharts);

export default router;
