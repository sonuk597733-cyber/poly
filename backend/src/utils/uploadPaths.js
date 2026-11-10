import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root uploads directory: <subharti>/uploads
export const ROOT_UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");
// Backend uploads directory (fallback): <subharti>/backend/uploads
export const BACKEND_UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

/**
 * Returns canonical destination folder for new file uploads
 */
export function getUploadDestination(subpath = "") {
  const dir = path.join(ROOT_UPLOADS_DIR, subpath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Robustly find an existing uploaded file across all candidate directory layouts
 */
export function resolveUploadFile(relativeOrFilename, subfolder = "") {
  if (!relativeOrFilename) return null;

  // Strip leading slashes and any /uploads/ prefix
  const clean = relativeOrFilename.replace(/^\/+uploads\/+/, "").replace(/^\/+/, "");

  const candidates = [
    path.join(ROOT_UPLOADS_DIR, clean),
    path.join(BACKEND_UPLOADS_DIR, clean),
    subfolder ? path.join(ROOT_UPLOADS_DIR, subfolder, path.basename(clean)) : null,
    subfolder ? path.join(BACKEND_UPLOADS_DIR, subfolder, path.basename(clean)) : null,
    path.resolve(process.cwd(), relativeOrFilename),
    path.resolve(process.cwd(), "uploads", clean)
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to primary destination path
  return subfolder ? path.join(ROOT_UPLOADS_DIR, subfolder, path.basename(clean)) : path.join(ROOT_UPLOADS_DIR, clean);
}
