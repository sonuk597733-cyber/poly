import jwt from "jsonwebtoken";

const DEFAULT_JWT_SECRET = "collegeos_dev_jwt_secret_change_in_production_svsu_2026";

/**
 * Generate signed JWT
 */
export function generateToken(user) {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    role: user.role,
    status: user.status
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

/**
 * Centralized Cookie Options Generator
 */
export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

/**
 * Attach HTTP-only cookie and return standard JSON response
 */
export function sendTokenResponse(
  user,
  statusCode,
  res,
  message = "Operation successful",
  profile = null
) {
  const token = generateToken(user);
  res.cookie("collegeos_token", token, getCookieOptions());

  return res.status(statusCode).json({
    success: true,
    message,
    user: typeof user.toJSON === "function" ? user.toJSON() : user,
    profile: profile
      ? typeof profile.toJSON === "function"
        ? profile.toJSON()
        : profile
      : null,
    token
  });
}

/**
 * Clear authentication cookie with identical options
 */
export function clearTokenCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("collegeos_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  });
}
