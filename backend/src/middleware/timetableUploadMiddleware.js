import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { getUploadDestination } from "../utils/uploadPaths.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = getUploadDestination("timetables");
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `timetable_${cleanBase}_${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIME_TYPES.has(mime)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Unsupported file format "${ext}". Allowed formats for timetable photographs are JPG, JPEG, PNG, and WebP.`
    )
  );
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max file size for high-res photo scans
  }
});

export const timetableUpload = (req, res, next) => {
  const upload = multerInstance.single("timetablePhoto");
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "The uploaded timetable image exceeds the 25 MB size limit."
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload timetable image."
      });
    }
    next();
  });
};
