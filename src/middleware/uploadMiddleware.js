import multer from "multer";
import path from "path";
import fs from "fs";

// Reusable multer storage function
export const createUploader = (destPath, filePrefix = "file") => {
  // Ensure directory exists
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const fileName = `${filePrefix}-${Date.now()}${ext}`;
      cb(null, fileName);
    },
  });

  return multer({ storage });
};
