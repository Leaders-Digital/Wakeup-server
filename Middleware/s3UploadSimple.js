const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if file is an image that can be converted to WebP
const isImageFile = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext);
};

// Custom storage that converts images to WebP (simple version)
const storage = {
  _handleFile: async function (req, file, cb) {
    try {
      const chunks = [];
      
      file.stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          let finalBuffer = buffer;
          let contentType = file.mimetype;
          let ext = path.extname(file.originalname).toLowerCase();
          
          // Convert images to WebP
          if (isImageFile(file.originalname)) {
            try {
              finalBuffer = await sharp(buffer)
                .webp({ quality: 85 })
                .toBuffer();
              contentType = 'image/webp';
              ext = '.webp';
            } catch (error) {
              console.warn(`⚠️  Could not convert ${file.originalname} to WebP, using original`);
              // Use original if conversion fails
            }
          }
          
          // Generate unique filename with timestamp
          const uniqueName = Date.now() + '-' + path.basename(file.originalname, path.extname(file.originalname)) + ext;
          const filePath = path.join(uploadDir, uniqueName);
          const relativePath = `/uploads/${uniqueName}`;
          
          // Write file to disk
          fs.writeFileSync(filePath, finalBuffer);
          
          cb(null, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: contentType,
            size: finalBuffer.length,
            destination: uploadDir,
            filename: uniqueName,
            path: relativePath, // Relative path for database storage
            location: relativePath // For backward compatibility
          });
        } catch (error) {
          cb(error);
        }
      });
      
      file.stream.on('error', cb);
    } catch (error) {
      cb(error);
    }
  },
  _removeFile: function (req, file, cb) {
    // Remove file if needed
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    cb(null);
  }
};

// Multer middleware configuration
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Export the middleware for use in routes
module.exports = upload;
