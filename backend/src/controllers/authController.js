import crypto from "node:crypto";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import TeacherProfile from "../models/TeacherProfile.js";
import HODProfile from "../models/HODProfile.js";
import CoordinatorProfile from "../models/CoordinatorProfile.js";
import PrincipalProfile from "../models/PrincipalProfile.js";
import PendingRegistration from "../models/PendingRegistration.js";
import AuditLog from "../models/AuditLog.js";
import {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from "../utils/validators.js";
import { sendTokenResponse, clearTokenCookie } from "../utils/tokens.js";
import {
  generateOtp,
  hashOtp,
  verifyOtpConstantTime,
  maskEmail
} from "../services/otpService.js";
import {
  sendVerificationOtpEmail,
  sendPasswordResetEmail
} from "../services/emailService.js";

/**
 * Helper to fetch a user's associated role profile
 */
export async function fetchRoleProfile(userId, role) {
  switch (role) {
    case "student":
      return StudentProfile.findOne({ userId });
    case "teacher":
      return TeacherProfile.findOne({ userId });
    case "hod":
      return HODProfile.findOne({ userId });
    case "coordinator":
      return CoordinatorProfile.findOne({ userId });
    case "principal":
      return PrincipalProfile.findOne({ userId });
    default:
      return null;
  }
}

/**
 * @route   POST /api/auth/register
 * @desc    Validate registration details, stage pending registration & dispatch Email OTP
 * @access  Public
 */
export async function register(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateRegistration(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || "Invalid registration submission.",
        errors
      });
    }

    // 1. Check if an active account already exists in User collection
    const existingUser = await User.findOne({ email: sanitized.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in instead."
      });
    }

    // 2. Generate cryptographically secure 6-digit OTP & compute SHA-256 hash
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // 3. Hash password using bcrypt (stored securely in staging, NEVER plaintext!)
    const passwordHash = await User.hashPassword(sanitized.password);

    // 4. Upsert pending registration record with 5-minute expiry
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const pending = await PendingRegistration.findOneAndUpdate(
      { email: sanitized.email },
      {
        email: sanitized.email,
        fullName: sanitized.fullName,
        passwordHash,
        role: sanitized.role,
        status: sanitized.status,
        roleData: {
          branch: sanitized.branch,
          academicYear: sanitized.academicYear,
          semester: sanitized.semester,
          enrollmentNo: sanitized.enrollmentNo,
          department: sanitized.department,
          employeeId: sanitized.employeeId,
          responsibilities: sanitized.responsibilities
        },
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        resendAttempts: 0,
        lastResentAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Send OTP via email service
    try {
      await sendVerificationOtpEmail({
        to: sanitized.email,
        name: sanitized.fullName,
        otp
      });
    } catch (mailErr) {
      console.error("[Register] Failed to send OTP email:", mailErr.message);
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(500).json({
        success: false,
        message: "Failed to dispatch verification email. Please verify your email address or try again later."
      });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${maskEmail(sanitized.email)}.`,
      email: sanitized.email,
      maskedEmail: maskEmail(sanitized.email),
      expiresInSeconds: 300,
      requiresOtp: true,
      // For dev/test environments only
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {})
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/auth/verify-email-otp
 * @desc    Verify 6-digit OTP, provision central User and linked RoleProfile
 * @access  Public
 */
export async function verifyEmailOtp(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (!email || !otp || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and the 6-digit verification code."
      });
    }

    // 1. Atomically check attempt limit and increment attempts in a single operation
    const pending = await PendingRegistration.findOneAndUpdate(
      { email, otpAttempts: { $lt: 5 } },
      { $inc: { otpAttempts: 1 } },
      { new: true }
    );

    if (!pending) {
      const existingPending = await PendingRegistration.findOne({ email });
      if (existingPending && existingPending.otpAttempts >= 5) {
        return res.status(400).json({
          success: false,
          message: "Maximum verification attempts exceeded. Please request a new code.",
          maxAttemptsExceeded: true
        });
      }
      return res.status(400).json({
        success: false,
        message: "Registration session not found or has expired. Please restart registration."
      });
    }

    // 2. Check expiration (application enforcement independent of asynchronous TTL cleanup)
    if (new Date() > pending.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please click 'Resend Code' to receive a new one.",
        isExpired: true
      });
    }

    // 3. Constant-time OTP comparison
    const isMatch = verifyOtpConstantTime(otp, pending.otpHash);
    if (!isMatch) {
      const remaining = Math.max(0, 5 - pending.otpAttempts);
      return res.status(400).json({
        success: false,
        message:
          remaining > 0
            ? `Invalid verification code. You have ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`
            : "Invalid verification code. Maximum attempts reached. Please request a new code.",
        remainingAttempts: remaining
      });
    }

    // 4. Atomically claim/delete pending registration to prevent duplicate verification races
    const claimed = await PendingRegistration.findOneAndDelete({ _id: pending._id });
    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address has already been created or verified. Please sign in."
      });
    }

    // 5. Concurrency guard: check if User already exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in."
      });
    }

    // 6. Provision central User
    const user = new User({
      fullName: pending.fullName,
      email: pending.email,
      passwordHash: pending.passwordHash,
      role: pending.role,
      status: pending.status,
      isEmailVerified: true
    });
    await user.save();

    // 7. Provision Role-Specific Profile Collection
    const rd = pending.roleData || {};
    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.create({
        userId: user._id,
        branch: rd.branch,
        academicYear: rd.academicYear,
        semester: rd.semester,
        enrollmentNo: rd.enrollmentNo,
        verificationStatus: "pending_verification"
      });
    } else if (user.role === "teacher") {
      profile = await TeacherProfile.create({
        userId: user._id,
        department: rd.department,
        employeeId: rd.employeeId,
        responsibilities: rd.responsibilities,
        approvalStatus: "pending_approval"
      });
    } else if (user.role === "hod") {
      profile = await HODProfile.create({
        userId: user._id,
        department: rd.department,
        employeeId: rd.employeeId,
        leadershipDetails: rd.responsibilities,
        approvalStatus: "pending_approval"
      });
    } else if (user.role === "coordinator") {
      profile = await CoordinatorProfile.create({
        userId: user._id,
        department: rd.department,
        employeeId: rd.employeeId,
        responsibilities: rd.responsibilities,
        approvalStatus: "pending_approval"
      });
    } else if (user.role === "principal") {
      profile = await PrincipalProfile.create({
        userId: user._id,
        employeeId: rd.employeeId,
        approvalStatus: "pending_approval"
      });
    }

    // 8. Response handling based on institutional approval policy
    const isStaff = user.role !== "student";

    if (isStaff) {
      return res.status(201).json({
        success: true,
        message: "Email verified successfully! Your staff access request has been routed for Dean authorization.",
        user: user.toJSON(),
        profile: profile ? profile.toJSON() : null,
        requiresApproval: true
      });
    }

    // Students receive active session cookie & JWT
    return sendTokenResponse(
      user,
      201,
      res,
      "Email verified! Your student account is now active on Subharti Polytechnic.",
      profile
    );
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in."
      });
    }
    next(error);
  }
}

/**
 * @route   POST /api/auth/resend-email-otp
 * @desc    Generate a new OTP, invalidate prior OTP & re-dispatch email
 * @access  Public
 */
export async function resendEmailOtp(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address."
      });
    }

    const pending = await PendingRegistration.findOne({ email });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email address. Please start registration."
      });
    }

    // Rate limiting: 45-second cooldown between resend requests
    const secondsSinceLast = (Date.now() - new Date(pending.lastResentAt).getTime()) / 1000;
    if (secondsSinceLast < 45) {
      const wait = Math.ceil(45 - secondsSinceLast);
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait} seconds before requesting another code.`,
        retryAfterSeconds: wait
      });
    }

    // Limit maximum resend attempts (max 5)
    if (pending.resendAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP resend attempts exceeded. Please try registering again later."
      });
    }

    // Generate new OTP and reset counters
    const newOtp = generateOtp();
    const otpHash = hashOtp(newOtp);
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Atomically update with cooldown check to prevent race condition double-sends
    const cooldownDate = new Date(Date.now() - 44 * 1000);
    const updated = await PendingRegistration.findOneAndUpdate(
      {
        email,
        resendAttempts: { $lt: 5 },
        lastResentAt: { $lte: cooldownDate }
      },
      {
        $set: {
          otpHash,
          otpExpiresAt,
          otpAttempts: 0,
          lastResentAt: new Date()
        },
        $inc: { resendAttempts: 1 }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another code.",
        retryAfterSeconds: 45
      });
    }

    // Send email
    try {
      await sendVerificationOtpEmail({
        to: updated.email,
        name: updated.fullName,
        otp: newOtp
      });
    } catch (mailErr) {
      console.error("[ResendOTP] Failed to send email:", mailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to dispatch verification email. Please try again later."
      });
    }

    return res.status(200).json({
      success: true,
      message: `A new verification code has been dispatched to ${maskEmail(updated.email)}.`,
      maskedEmail: maskEmail(updated.email),
      expiresInSeconds: 300,
      remainingResends: 5 - updated.resendAttempts,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: newOtp } : {})
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate with email & password, verify email verification status
 * @access  Public
 */
export async function login(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateLogin(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || "Please provide both email and password.",
        errors
      });
    }

    // Query user and select passwordHash
    const user = await User.findOne({ email: sanitized.email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password. Please verify your credentials."
      });
    }

    // Check password match
    const isMatch = await user.comparePassword(sanitized.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email address or password. Please verify your credentials."
      });
    }

    // Check email verification state
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Your email address has not been verified yet. Please complete verification before logging in.",
        unverified: true,
        email: user.email
      });
    }

    // Check account status
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your institutional account has been suspended by administration. Please contact IT support."
      });
    }

    // Update last login timestamp & record in loginHistory
    user.lastLoginAt = new Date();
    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";
    let device = "Desktop";
    if (/mobile/i.test(userAgent)) device = "Mobile";
    else if (/tablet|ipad/i.test(userAgent)) device = "Tablet";

    if (!Array.isArray(user.loginHistory)) {
      user.loginHistory = [];
    }
    user.loginHistory.unshift({
      ipAddress: rawIp,
      userAgent: userAgent.slice(0, 150),
      device,
      loggedInAt: new Date()
    });
    if (user.loginHistory.length > 15) {
      user.loginHistory = user.loginHistory.slice(0, 15);
    }
    await user.save({ validateBeforeSave: false });

    // Non-blocking login AuditLog
    AuditLog.create({
      action: "USER_LOGIN",
      performedBy: user._id,
      performerName: user.fullName,
      performerRole: user.role,
      ipAddress: rawIp,
      resourceType: "Auth",
      resourceId: user._id.toString(),
      details: { device, userAgent: userAgent.slice(0, 100) }
    }).catch((err) => console.error("[AuditLog] Login recording error:", err.message));

    // Fetch linked role profile
    const profile = await fetchRoleProfile(user._id, user.role);

    return sendTokenResponse(user, 200, res, "Authentication successful.", profile);
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's safe profile and role profile
 * @access  Private (Requires valid JWT)
 */
export async function getMe(req, res, next) {
  try {
    const profile = await fetchRoleProfile(req.user._id, req.user.role);
    return res.status(200).json({
      success: true,
      user: req.user,
      profile: profile ? (typeof profile.toJSON === "function" ? profile.toJSON() : profile) : null
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @route   POST /api/auth/logout
 * @desc    Sign out and clear session cookie
 * @access  Public / Private
 */
export async function logout(_req, res) {
  clearTokenCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully from CollegeOS."
  });
}

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset link via email
 * @access  Public (Rate limited)
 */
export async function forgotPassword(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateForgotPassword(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || "Please enter a valid email address.",
        errors
      });
    }

    const genericSuccess = {
      success: true,
      message: "If an account with that email exists in the Subharti ledger, a password reset link has been dispatched."
    };

    const user = await User.findOne({ email: sanitized.email });
    if (!user) {
      return res.status(200).json(genericSuccess);
    }

    // Generate token and save in DB
    const resetToken = user.createPasswordResetToken(15);
    await user.save({ validateBeforeSave: false });

    // Build reset link
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendBase}/#/reset-password?token=${resetToken}`;

    // Dispatch email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.fullName,
        resetUrl
      });
    } catch (mailErr) {
      console.error("[ForgotPassword] Email delivery failed:", mailErr.message);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Failed to dispatch password recovery email. Please try again later."
      });
    }

    return res.status(200).json({
      ...genericSuccess,
      ...(process.env.NODE_ENV === "development" ? { devResetUrl: resetUrl } : {})
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using valid reset token
 * @access  Public (Rate limited)
 */
export async function resetPassword(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateResetPassword(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || "Invalid password reset request.",
        errors
      });
    }

    // Compute SHA-256 hash of provided token
    const tokenHash = crypto
      .createHash("sha256")
      .update(sanitized.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() }
    }).select("+passwordResetTokenHash +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired. Please request a new link."
      });
    }

    user.passwordHash = await User.hashPassword(sanitized.newPassword);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now sign in with your new credentials."
    });
  } catch (error) {
    next(error);
  }
}
