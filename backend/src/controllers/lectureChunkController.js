import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { getUploadDestination } from "../utils/uploadPaths.js";

const MAX_TOTAL_SIZE = 600 * 1024 * 1024; // 600 MB
const ALLOWED_VIDEO_EXTS = [".mp4", ".webm", ".mkv", ".mov", ".avi", ".m4v", ".flv", ".wmv"];

/**
 * Initialize a resumable chunk upload session
 */
export async function initChunkUpload(req, res) {
  try {
    const { filename, totalSize, totalChunks, mimeType } = req.body;

    if (!filename || !totalSize || !totalChunks) {
      return res.status(400).json({
        success: false,
        message: "filename, totalSize, and totalChunks are required to initialize chunk upload."
      });
    }

    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported video format "${ext}". Allowed: ${ALLOWED_VIDEO_EXTS.join(", ")}`
      });
    }

    const sizeNum = Number(totalSize);
    if (sizeNum > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Video size (${(sizeNum / (1024 * 1024)).toFixed(1)} MB) exceeds max allowable limit of 600 MB.`
      });
    }

    const uploadId = `upl_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const chunkDir = path.join(getUploadDestination("temp/chunks"), uploadId);

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const sessionData = {
      uploadId,
      filename,
      totalSize: sizeNum,
      totalChunks: Number(totalChunks),
      mimeType: mimeType || "video/mp4",
      userId: req.user?._id?.toString() || "",
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(chunkDir, "session.json"), JSON.stringify(sessionData, null, 2));

    // Opportunistically clean old temp sessions
    cleanOldUploadSessions();

    return res.status(200).json({
      success: true,
      uploadId,
      filename,
      totalChunks: Number(totalChunks),
      totalSize: sizeNum
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to initialize chunk upload: ${error.message}`
    });
  }
}

/**
 * Upload an individual chunk (disk-backed via multer)
 */
export async function uploadChunk(req, res) {
  try {
    const { uploadId, chunkIndex, totalChunks } = req.body;

    if (!uploadId || chunkIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: "uploadId and chunkIndex are required."
      });
    }

    const chunkDir = path.join(getUploadDestination("temp/chunks"), uploadId.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({
        success: false,
        message: "Upload session not found or expired. Please re-initiate upload."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No chunk binary data received in request."
      });
    }

    return res.status(200).json({
      success: true,
      uploadId,
      chunkIndex: Number(chunkIndex),
      receivedBytes: req.file.size
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to save chunk: ${error.message}`
    });
  }
}

/**
 * Check upload status & resume info for an existing uploadId
 */
export async function getChunkUploadStatus(req, res) {
  try {
    const { uploadId } = req.params;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: "uploadId is required." });
    }

    const chunkDir = path.join(getUploadDestination("temp/chunks"), uploadId.replace(/[^a-zA-Z0-9_-]/g, ""));
    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({
        success: false,
        message: "Upload session not found."
      });
    }

    const sessionFile = path.join(chunkDir, "session.json");
    let session = {};
    if (fs.existsSync(sessionFile)) {
      session = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
    }

    const files = fs.readdirSync(chunkDir);
    const uploadedChunks = files
      .filter((f) => f.startsWith("chunk_"))
      .map((f) => parseInt(f.replace("chunk_", ""), 10))
      .sort((a, b) => a - b);

    return res.status(200).json({
      success: true,
      uploadId,
      totalChunks: session.totalChunks || 0,
      totalSize: session.totalSize || 0,
      uploadedChunks,
      isComplete: session.totalChunks ? uploadedChunks.length === session.totalChunks : false
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to query chunk status: ${error.message}`
    });
  }
}

/**
 * Complete and stitch all chunks together into the final video file
 */
export async function completeChunkUpload(req, res) {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ success: false, message: "uploadId is required." });
    }

    const cleanUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
    const chunkDir = path.join(getUploadDestination("temp/chunks"), cleanUploadId);

    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({
        success: false,
        message: "Upload session not found or already completed."
      });
    }

    const sessionFile = path.join(chunkDir, "session.json");
    if (!fs.existsSync(sessionFile)) {
      return res.status(400).json({
        success: false,
        message: "Missing session metadata file."
      });
    }

    const session = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
    const totalChunks = session.totalChunks;

    // Verify all chunks exist
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({
          success: false,
          missingChunk: i,
          message: `Chunk #${i} is missing. Please resume or re-upload missing chunk.`
        });
      }
    }

    // Build final destination filename
    const ext = path.extname(session.filename).toLowerCase();
    const cleanBase = path
      .basename(session.filename, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const finalFilename = `${cleanBase}-${uniqueSuffix}${ext}`;
    const targetDir = getUploadDestination("lectures/videos");
    const finalPath = path.join(targetDir, finalFilename);

    // Merge chunks sequentially
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk_${i}`);
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Verify merged file
    const stat = fs.statSync(finalPath);
    if (stat.size === 0) {
      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      return res.status(500).json({
        success: false,
        message: "Merged video file is empty. Upload failed."
      });
    }

    // Clean up temporary chunk folder
    try {
      fs.rmSync(chunkDir, { recursive: true, force: true });
    } catch (cleanErr) {
      console.warn("Could not remove temp chunk directory:", cleanErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Video upload completed and assembled successfully.",
      videoFile: {
        filename: finalFilename,
        originalname: session.filename,
        originalName: session.filename,
        mimetype: session.mimeType || "video/mp4",
        mimeType: session.mimeType || "video/mp4",
        size: stat.size,
        fileSize: stat.size,
        path: finalPath,
        url: `/uploads/lectures/videos/${finalFilename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to assemble chunks: ${error.message}`
    });
  }
}

/**
 * Remove stale sessions older than 24 hours
 */
function cleanOldUploadSessions() {
  try {
    const chunksBase = getUploadDestination("temp/chunks");
    if (!fs.existsSync(chunksBase)) return;

    const dirs = fs.readdirSync(chunksBase);
    const now = Date.now();
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

    for (const dir of dirs) {
      const sessionPath = path.join(chunksBase, dir);
      try {
        const stat = fs.statSync(sessionPath);
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Cleanup old upload sessions error:", err.message);
  }
}
