const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary securely on the server using environment variables
// NEVER expose CLOUDINARY_API_SECRET to frontend clients
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== "your_cloud_name" &&
  cloudName !== "demo_cloud" &&
  apiSecret !== "your_api_secret_kept_server_side"
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
  console.warn("[Cloudinary] Real credentials not set in .env. Falling back to local data URI mode.");
}

// POST /api/upload
// Secure server-side endpoint for media uploads (images and videos)
router.post("/", async (req, res) => {
  try {
    const { file, folder = "ownx_uploads", resource_type = "auto" } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No media file provided for upload" });
    }

    // If Cloudinary is configured with valid credentials, perform secure server-side upload
    if (isConfigured) {
      const uploadResult = await cloudinary.uploader.upload(file, {
        folder,
        resource_type,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov"]
      });

      return res.json({
        success: true,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        bytes: uploadResult.bytes
      });
    }

    // Local development fallback if Cloudinary credentials are not set in .env yet
    const isVideo = typeof file === "string" && (file.startsWith("data:video") || file.includes(".mp4"));
    return res.json({
      success: true,
      url: file,
      resource_type: isVideo ? "video" : "image",
      notice: "Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env for production CDN storage."
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    return res.status(500).json({
      error: "Upload failed. Please check file format and server credentials.",
      details: err.message
    });
  }
});

module.exports = router;
