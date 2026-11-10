import { Router } from "express";
import {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, recoveryLimiter } from "../middleware/rateLimitMiddleware.js";

const router = Router();

// Registration & Email OTP Endpoints
router.post("/register", authLimiter, register);
router.post("/verify-email-otp", authLimiter, verifyEmailOtp);
router.post("/resend-email-otp", recoveryLimiter, resendEmailOtp);

// Authentication Endpoints
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.post("/logout", logout);

// Password Recovery Endpoints
router.post("/forgot-password", recoveryLimiter, forgotPassword);
router.post("/reset-password", recoveryLimiter, resetPassword);

export default router;
