const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadFile = ({
  folder = "uploads",
  acceptedTypes = null, // null = accept all types
  fieldName = "file",
  fileName = "file",
  multiple = false,
  maxCount = 5
} = {}) => {
  // Validate file type only if acceptedTypes is provided
  const fileFilter = acceptedTypes && acceptedTypes.length > 0
    ? (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          return cb(new Error(`Type de fichier non supporté. Types acceptés: ${acceptedTypes.join(', ')}`));
        }
        cb(null, true);
      }
    : undefined; // Accept all file types if no acceptedTypes specified

  // Check if file is an image that can be converted to WebP
  const isImageFile = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext);
  };

  // Custom storage that converts images to WebP and saves locally
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
            
            // Generate unique filename
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            const filename = `${fileName}-${uniqueSuffix}${ext}`;
            
            // Create folder path
            const folderPath = path.join(uploadDir, folder);
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
            }
            
            // Full file path
            const filePath = path.join(folderPath, filename);
            const relativePath = `/${folder}/${filename}`;
            
            // Write file to disk
            fs.writeFileSync(filePath, finalBuffer);
            
            cb(null, {
              fieldname: file.fieldname,
              originalname: file.originalname,
              encoding: file.encoding,
              mimetype: contentType,
              size: finalBuffer.length,
              destination: folderPath,
              filename: filename,
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

  // Return multer instance with appropriate method based on `multiple` parameter
  const uploadConfig = {
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    }
  };

  // Only add fileFilter if it's defined
  if (fileFilter) {
    uploadConfig.fileFilter = fileFilter;
  }

  const upload = multer(uploadConfig);

  return multiple ? upload.array(fieldName, maxCount) : upload.single(fieldName);
};

module.exports = { uploadFile };
