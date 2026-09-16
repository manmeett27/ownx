const multer = require("multer");

// Use in-memory storage so buffers can be streamed directly to Cloudinary without leaving stale files on disk
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime"
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Unsupported file format '${file.mimetype}'. Supported formats: JPG, PNG, WebP, GIF, MP4, WebM.`),
      false
    );
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter
});

module.exports = upload;
