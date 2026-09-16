const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
require("dotenv").config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== "your_cloud_name" &&
  cloudName !== "demo_cloud" &&
  apiSecret !== "your_api_secret" &&
  !apiSecret.includes("<")
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log("[Cloudinary] Configured securely server-side for cloud:", cloudName);
} else {
  console.log("[Cloudinary] Real credentials not set in .env. Falling back to local media storage.");
}

/**
 * Save file locally when Cloudinary is not configured or unreachable
 */
function saveMediaLocally(fileBuffer, options = {}) {
  const uploadDir = path.join(__dirname, "..", "media", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const isVideo = options.resource_type === "video";
  const ext = isVideo ? ".mp4" : ".jpg";
  const filename = `media_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, fileBuffer);

  const localUrl = `http://127.0.0.1:5000/media/uploads/${filename}`;
  return {
    secure_url: localUrl,
    url: localUrl,
    public_id: filename,
    resource_type: isVideo ? "video" : "image",
    provider: "local"
  };
}

/**
 * Upload a media buffer to Cloudinary using upload_stream with automatic local fallback
 * @param {Buffer} fileBuffer - The file buffer from multer (memoryStorage)
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Resolves with media response { secure_url, public_id, resource_type, provider, ... }
 */
function uploadMediaStream(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured in .env, seamlessly use local storage
    if (!isConfigured) {
      try {
        const localResult = saveMediaLocally(fileBuffer, options);
        return resolve(localResult);
      } catch (localErr) {
        return reject(localErr);
      }
    }

    const defaultOptions = {
      folder: "ownx_posts",
      resource_type: "auto",
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          console.warn("[Cloudinary Warning] Cloudinary upload failed. Falling back to local storage:", error.message);
          try {
            const fallbackResult = saveMediaLocally(fileBuffer, options);
            fallbackResult.notice = `Cloudinary upload failed: ${error.message}. Saved to local media.`;
            return resolve(fallbackResult);
          } catch (localErr) {
            let userMessage = error.message || "Media upload failed";
            const err = new Error(userMessage);
            err.http_code = error.http_code || 500;
            err.cloudinaryError = error;
            return reject(err);
          }
        }
        result.provider = "cloudinary";
        resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}

module.exports = {
  cloudinary,
  isConfigured,
  uploadMediaStream
};
