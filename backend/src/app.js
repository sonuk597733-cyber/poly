import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import studentDirectoryRoutes from "./routes/studentDirectoryRoutes.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import { getDBStatus } from "./config/db.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";
import { ROOT_UPLOADS_DIR, BACKEND_UPLOADS_DIR } from "./utils/uploadPaths.js";

const app = express();

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://sonuk597733-cyber.github.io",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
].filter(Boolean);

// Ensure base domain origin is accepted even if FRONTEND_URL includes path or trailing slash
if (process.env.FRONTEND_URL) {
  try {
    const parsedOrigin = new URL(process.env.FRONTEND_URL).origin;
    if (!allowedOrigins.includes(parsedOrigin)) {
      allowedOrigins.push(parsedOrigin);
    }
  } catch {}
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, automated test suites)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Block unauthorized cross-origin requests
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"]
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// 4. Static Uploads Serving (Unified storage across root and backend directories)
app.use("/uploads", express.static(ROOT_UPLOADS_DIR));
app.use("/uploads", express.static(BACKEND_UPLOADS_DIR));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// 5. Request Logging (disabled during automated test runs)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// 6. Health Check Endpoint
app.get("/api/health", (_req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "healthy" : "degraded",
    institution: "Swami Vivekanand Subharti University",
    campus: "Subharti Polytechnic",
    service: "CollegeOS Core API Gateway",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus
  });
});

// 7. Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/students", studentDirectoryRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);

// 8. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
