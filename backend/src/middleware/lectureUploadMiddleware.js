import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { getUploadDestination } from "../utils/uploadPaths.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subpath = "lectures/resources";

    if (file.fieldname === "videoFile") {
      subpath = "lectures/videos";
    } else if (file.fieldname === "thumbnailFile") {
      subpath = "lectures/thumbnails";
    }

    const uploadDir = getUploadDestination(subpath);
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "videoFile") {
    const allowedVideoExts = [".mp4", ".webm", ".mkv", ".mov", ".avi", ".m4v", ".flv", ".wmv"];
    if (allowedVideoExts.includes(ext) || file.mimetype.startsWith("video/")) {
      return cb(null, true);
    }
    return cb(new Error("Only video files (.mp4, .webm, .mkv, .mov, .avi, .m4v) are allowed for video upload."));
  }

  if (file.fieldname === "thumbnailFile") {
    const allowedThumbExts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];
    if (allowedThumbExts.includes(ext) || file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image files (.jpg, .jpeg, .png, .webp, .svg) are allowed for thumbnails."));
  }

  // Resource attachments: All documents, slides, spreadsheets, images, archives, audio, and code
  const allowedResourceExts = [
    // Documents
    ".pdf", ".ppt", ".pptx", ".doc", ".docx", ".txt", ".rtf", ".odt",
    // Spreadsheets & Data
    ".xls", ".xlsx", ".csv", ".ods",
    // Images
    ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp",
    // Archives
    ".zip", ".rar", ".7z", ".tar", ".gz",
    // Audio
    ".mp3", ".wav", ".aac", ".m4a", ".ogg", ".flac",
    // Code & Markup
    ".py", ".java", ".c", ".cpp", ".cs", ".js", ".ts", ".html", ".css", ".json", ".sql", ".sh", ".xml", ".md"
  ];

  if (
    allowedResourceExts.includes(ext) ||
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("audio/") ||
    file.mimetype === "application/pdf"
  ) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `File extension "${ext}" is not supported. Allowed formats include PDF, Word, PowerPoint, Spreadsheets, Images, Archives, Audio, and Code files.`
    )
  );
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 600 * 1024 * 1024, // 600 MB max file size
    fieldSize: 25 * 1024 * 1024 // 25 MB max non-file field size
  }
}).fields([
  { name: "videoFile", maxCount: 1 },
  { name: "thumbnailFile", maxCount: 1 },
  { name: "resourceFiles", maxCount: 30 },
  { name: "documents", maxCount: 30 },
  { name: "attachments", maxCount: 30 },
  { name: "files", maxCount: 30 }
]);

export function lectureUpload(req, res, next) {
  multerInstance(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File exceeds the allowed size limit of 600 MB. Please compress or select a smaller file."
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: `Unexpected file field: ${err.field}. Max 30 documents and 1 video allowed.`
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process uploaded files."
      });
    }
    next();
  });
}

// Chunk upload for resumable large uploads (5MB - 50MB per chunk)
const chunkStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadId = (req.body.uploadId || req.query.uploadId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
    const chunkDir = path.join(getUploadDestination("temp/chunks"), uploadId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }
    cb(null, chunkDir);
  },
  filename: (req, _file, cb) => {
    const chunkIndex = parseInt(req.body.chunkIndex ?? req.query.chunkIndex ?? "0", 10);
    cb(null, `chunk_${chunkIndex}`);
  }
});

const chunkMulter = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 60 * 1024 * 1024 // 60 MB max per single chunk
  }
}).single("chunk");

export function lectureChunkUpload(req, res, next) {
  chunkMulter(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Chunk upload failed: ${err.message}`
      });
    }
    next();
  });
}
