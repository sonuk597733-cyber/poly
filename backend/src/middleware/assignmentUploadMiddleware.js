import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { getUploadDestination } from "../utils/uploadPaths.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine whether this is a faculty reference upload or student submission upload
    const subfolder = file.fieldname === "submissionFiles"
      ? path.join("assignments", "submissions")
      : path.join("assignments", "references");

    const uploadDir = getUploadDestination(subfolder);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".zip",
  ".rar",
  ".7z",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt"
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return cb(null, true);
  }
  return cb(
    new Error(
      `File extension "${ext}" is not permitted. Supported formats: PDF, Word, PowerPoint, Excel, ZIP/RAR Archives, Images, and Text.`
    )
  );
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB per file
  }
}).fields([
  { name: "referenceFiles", maxCount: 5 },
  { name: "submissionFiles", maxCount: 5 },
  // Backward compatibility fields
  { name: "file", maxCount: 1 },
  { name: "files", maxCount: 5 }
]);

export const assignmentUpload = (req, res, next) => {
  multerInstance(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File exceeds the maximum allowed size of 50 MB."
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * Helper to compute SHA-256 checksum for an uploaded file
 */
export function computeFileChecksum(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  } catch (err) {
    console.warn("Could not compute file checksum:", err.message);
    return null;
  }
}
