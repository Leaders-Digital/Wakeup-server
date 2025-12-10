const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 Bucket name or Access Point alias
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Validate that bucket name or access point alias is provided
if (!BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
}

// Check if it's an Access Point alias (contains 's3alias' or starts with 'arn:aws:s3')
const isAccessPoint = BUCKET_NAME.includes('s3alias') || BUCKET_NAME.startsWith('arn:aws:s3');

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
          const key = `uploads/${uniqueName}`;
          
          // Upload to S3
          const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: finalBuffer,
            ContentType: contentType,
            ...(isAccessPoint ? {} : { ACL: 'public-read' }),
          });
          
          await s3Client.send(command);
          
          // Get S3 URL
          const region = process.env.AWS_REGION || 'us-east-1';
          const location = isAccessPoint
            ? `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
            : `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
          
          cb(null, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: contentType,
            size: finalBuffer.length,
            bucket: BUCKET_NAME,
            key: key,
            acl: isAccessPoint ? undefined : 'public-read',
            contentType: contentType,
            metadata: { fieldName: file.fieldname },
            location: location,
            etag: `"${crypto.createHash('md5').update(finalBuffer).digest('hex')}"`
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
    // Nothing to remove since we're using memory storage
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

