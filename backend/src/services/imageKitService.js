import fs from "node:fs";
import path from "node:path";
import ImageKit from "imagekit";

let imagekitInstance = null;

/**
 * Initialize ImageKit client using environment variables
 */
export function getImageKitClient() {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (publicKey && privateKey && urlEndpoint) {
    try {
      imagekitInstance = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint
      });
      return imagekitInstance;
    } catch (err) {
      console.error("[ImageKit] Initialization error:", err.message);
      return null;
    }
  }

  return null;
}

/**
 * Upload an image buffer to ImageKit (with local static fallback if offline or during test runs)
 * @param {Object} options
 * @param {Buffer} options.buffer - Raw binary image buffer
 * @param {string} options.fileName - File name
 * @param {string} options.folder - Destination folder in ImageKit (e.g. "/collegeos/avatars")
 * @param {string[]} options.tags - Metadata tags
 */
export async function uploadImage({ buffer, fileName, folder = "/collegeos/avatars", tags = [] }) {
  const client = getImageKitClient();

  if (client) {
    try {
      const response = await client.upload({
        file: buffer,
        fileName,
        folder,
        tags,
        useUniqueFileName: true
      });

      return {
        url: response.url,
        fileId: response.fileId,
        thumbnailUrl: response.thumbnailUrl || response.url,
        provider: "imagekit"
      };
    } catch (err) {
      console.error("[ImageKit] Cloud upload failed, falling back to local storage:", err.message);
    }
  }

  // Local storage fallback
  const cleanFolder = folder.replace(/^\//, "").replace(/\//g, path.sep);
  const uploadDir = path.resolve(process.cwd(), "uploads", cleanFolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = `${Date.now()}_${path.basename(fileName)}`;
  const destPath = path.join(uploadDir, safeName);
  fs.writeFileSync(destPath, buffer);

  const relativeUrl = `/uploads/${folder.replace(/^\//, "")}/${safeName}`.replace(/\\/g, "/");
  return {
    url: relativeUrl,
    fileId: `local_${safeName}`,
    thumbnailUrl: relativeUrl,
    provider: "local"
  };
}

/**
 * Safely delete an existing asset from ImageKit or local storage
 * @param {string} fileId - ImageKit fileId or local identifier
 * @param {string} [url] - Local file URL if fallback was used
 */
export async function deleteImage(fileId, url = null) {
  if (!fileId) return;

  const client = getImageKitClient();
  if (client && !fileId.startsWith("local_")) {
    try {
      await client.deleteFile(fileId);
      return;
    } catch (err) {
      console.warn("[ImageKit] Deletion notice (non-fatal):", err.message);
    }
  }

  // Local file cleanup
  if (url && url.startsWith("/uploads/")) {
    try {
      const localPath = path.resolve(process.cwd(), url.replace(/^\//, ""));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch {
      // ignore
    }
  }
}
