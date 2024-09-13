// multerConfig.js
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

// Multer middleware configuration
const upload = multer({ storage: storage });

// Export the middleware for use in routes
module.exports = upload;
