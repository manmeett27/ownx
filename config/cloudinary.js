const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary server-side using environment variables
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

/**
 * Upload a media buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - The file buffer from multer (memoryStorage)
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Resolves with Cloudinary response { secure_url, public_id, resource_type, ... }
 */
function uploadMediaStream(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!cloudName || !apiKey || !apiSecret) {
      return reject(
        new Error("Cloudinary credentials are not configured in backend .env. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
      );
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
          console.error("[Cloudinary API Error]:", error);
          let userMessage = error.message || "Cloudinary media upload failed";
          if (error.http_code === 401 && error.message.includes("cloud_name mismatch")) {
            userMessage = `Cloudinary authentication failed: Cloud name '${cloudName}' does not match the provided API Key. Please check the Cloud name on your Cloudinary dashboard.`;
          }
          const err = new Error(userMessage);
          err.http_code = error.http_code || 500;
          err.cloudinaryError = error;
          return reject(err);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  cloudinary,
  uploadMediaStream
};
