import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { getUploadDestination } from "../utils/uploadPaths.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = getUploadDestination("notes");
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
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
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".txt",
  ".rtf",
  ".xls",
  ".xlsx",
  ".zip",
  ".rar",
  ".7z",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp"
]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    return cb(null, true);
  }
  return cb(
    new Error(
      `File format "${ext}" is not supported. Allowed formats include PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx), Excel (.xls/.xlsx), Archives (.zip/.rar), Plaintext (.txt), and Images (.png/.jpg).`
    )
  );
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max file size
  }
}).fields([
  { name: "file", maxCount: 5 },
  { name: "files", maxCount: 30 },
  { name: "replacementFiles", maxCount: 30 }
]);

export const noteUpload = (req, res, next) => {
  multerInstance(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File exceeds the maximum permitted size limit of 100 MB."
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    // Normalize: if req.files.file exists, expose req.file for backward compatibility
    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      } else if (req.files.files && req.files.files[0]) {
        req.file = req.files.files[0];
      }
    }
    next();
  });
};

/**
 * Utility to calculate SHA-256 hash of a file on disk
 */
export function calculateFileChecksum(filePath) {
  try {
    if (!fs.existsSync(filePath)) return "";
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buffer).digest("hex");
  } catch (err) {
    console.warn("[Checksum Error]", err.message);
    return "";
  }
}
