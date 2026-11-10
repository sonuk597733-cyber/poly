import jwt from "jsonwebtoken";
import User from "../models/User.js";

const DEFAULT_JWT_SECRET = "collegeos_dev_jwt_secret_change_in_production_svsu_2026";

const CSRF_ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
].filter(Boolean);

/**
 * Protect routes: verifies JWT from cookie or Authorization header,
 * enforces CSRF protection on cookie-authenticated mutating requests,
 * and validates that password was not changed after token issuance.
 */
export async function protect(req, res, next) {
  let token = null;
  let isCookieAuth = false;

  // 1. Check Authorization: Bearer <token> first (explicit client credential takes priority)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. Check HTTP-only cookie
  else if (req.cookies && req.cookies.collegeos_token) {
    token = req.cookies.collegeos_token;
    isCookieAuth = true;
  }
  // 3. Check query param token for direct GET download/stream requests
  else if (req.query && req.query.token && req.method === "GET") {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please sign in to access this resource."
    });
  }

  // 3. CSRF defense for cookie-authenticated mutating requests
  if (isCookieAuth && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && !CSRF_ALLOWED_ORIGINS.includes(origin)) {
      return res.status(403).json({
        success: false,
        message: "Cross-site request blocked (CSRF protection)."
      });
    }
  }

  try {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).select("+passwordChangedAt");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user account associated with this token no longer exists."
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your institutional account has been suspended by administration."
      });
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat && decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: "Your password was recently changed. Please sign in again."
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again."
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token. Please sign in again."
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}
