/**
 * 404 Not Found Middleware
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found on CollegeOS Gateway: ${req.method} ${req.originalUrl}`
  });
}

/**
 * Centralized Application Error Handler
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode < 400) statusCode = 500;

  let message = err.message || "An unexpected server error occurred.";
  let errors = err.errors || [];

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = "An account with this email address already exists. Please sign in instead.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => val.message);
    message = errors.join(", ") || "Validation failed.";
  }

  // Mongoose invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid resource identifier: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication credentials.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please sign in again.";
  }

  // Multer & File Upload Errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image file size exceeds the allowed 2MB limit. Please upload a smaller image.";
    } else {
      message = `File upload error: ${err.message}`;
    }
  } else if (err.message && err.message.includes("Unsupported file format")) {
    statusCode = 400;
    message = err.message;
  }

  // Log in development
  if (process.env.NODE_ENV !== "test" && statusCode === 500) {
    console.error("[CollegeOS Error]", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}
