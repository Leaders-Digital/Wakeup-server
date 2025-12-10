require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const mongoose = require('mongoose');
require('../Models/index');

// Import models
const Product = require('../Models/Produit.model');
const Variant = require('../Models/variant.model');
const Banner = require('../Models/banner.model');
const Blog = require('../Models/blog.model');
const Partenaire = require('../Models/Partenaire.model');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

if (!BUCKET_NAME) {
  console.error('❌ AWS_S3_BUCKET_NAME environment variable is required');
  process.exit(1);
}

// Check if it's an Access Point
const isAccessPoint = BUCKET_NAME.includes('s3alias') || BUCKET_NAME.startsWith('arn:aws:s3');

// Get S3 URL for a file
function getS3Url(key) {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  if (isAccessPoint) {
    // For Access Points with alias
    if (BUCKET_NAME.includes('s3alias')) {
      // Access Point alias format
      return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    } else {
      // Access Point ARN format
      const accountId = BUCKET_NAME.match(/arn:aws:s3:[^:]+:(\d+):accesspoint/)?.[1];
      const accessPointName = BUCKET_NAME.split('/').pop();
      return `https://${accessPointName}-${accountId}.s3-accesspoint.${region}.amazonaws.com/${key}`;
    }
  } else {
    // For regular buckets
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
  }
}

// Check if file is an image that can be converted to WebP
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext);
}

// Convert image to WebP
async function convertToWebP(filePath) {
  try {
    const buffer = await sharp(filePath)
      .webp({ quality: 85 }) // Quality 85 is a good balance between size and quality
      .toBuffer();
    return buffer;
  } catch (error) {
    console.warn(`⚠️  Could not convert ${filePath} to WebP, using original:`, error.message);
    return null; // Return null if conversion fails, will use original
  }
}

// Upload file to S3 (with WebP conversion for images)
async function uploadFileToS3(filePath, s3Key) {
  try {
    let fileContent;
    let contentType;
    let finalS3Key = s3Key;

    // Check if it's an image and convert to WebP
    if (isImageFile(filePath)) {
      const webpBuffer = await convertToWebP(filePath);
      if (webpBuffer) {
        fileContent = webpBuffer;
        contentType = 'image/webp';
        // Change extension to .webp in S3 key
        finalS3Key = s3Key.replace(/\.(jpg|jpeg|png|gif|bmp|tiff)$/i, '.webp');
      } else {
        // Conversion failed, use original file
        fileContent = fs.readFileSync(filePath);
        contentType = getContentType(filePath);
      }
    } else {
      // Not an image, upload as-is
      fileContent = fs.readFileSync(filePath);
      contentType = getContentType(filePath);
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: finalS3Key,
      Body: fileContent,
      ContentType: contentType,
      ...(isAccessPoint ? {} : { ACL: 'public-read' }), // Only set ACL for regular buckets
    });

    await s3Client.send(command);
    return getS3Url(finalS3Key);
  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    throw error;
  }
}

// Get content type from file extension
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Recursively get all files from a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Helper function to normalize paths for comparison
function normalizePathForComparison(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^uploads\//, '')
    .toLowerCase()
    .trim();
}

// Helper function to extract filename from path
function getFilename(p) {
  if (!p) return '';
  return path.basename(p).toLowerCase();
}

// Update database references with better path matching
async function updateDatabaseReferences(oldPath, newUrl) {
  const updates = [];
  const normalizedOldPath = normalizePathForComparison(oldPath);
  const filename = getFilename(oldPath);
  const filenameWithoutExt = path.basename(oldPath, path.extname(oldPath)).toLowerCase();

  // Update Products
  try {
    let productResult = { modifiedCount: 0 };
    
    // Strategy 1: Exact match
    productResult = await Product.updateMany(
      { mainPicture: oldPath },
      { $set: { mainPicture: newUrl } }
    );

    // Strategy 2: Find all products with local paths and match by filename
    if (productResult.modifiedCount === 0) {
      const allProducts = await Product.find({
        mainPicture: { $exists: true, $ne: null },
        mainPicture: { $not: { $regex: '^https?://' } } // Not already migrated
      });

      const matchingProducts = allProducts.filter(product => {
        const dbPath = normalizePathForComparison(product.mainPicture);
        const dbFilename = getFilename(product.mainPicture);
        const dbFilenameWithoutExt = path.basename(product.mainPicture, path.extname(product.mainPicture)).toLowerCase();
        
        return dbPath === normalizedOldPath || 
               dbFilename === filename || 
               dbFilenameWithoutExt === filenameWithoutExt ||
               dbPath.includes(filename) ||
               normalizedOldPath.includes(dbFilename);
      });

      if (matchingProducts.length > 0) {
        const productIds = matchingProducts.map(p => p._id);
        productResult = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { mainPicture: newUrl } }
        );
      }
    }

    if (productResult.modifiedCount > 0) {
      updates.push(`Products: ${productResult.modifiedCount} updated`);
    }
  } catch (error) {
    console.error(`Error updating Products:`, error.message);
  }

  // Update Variants
  try {
    let variantPictureResult = { modifiedCount: 0 };
    let variantIconResult = { modifiedCount: 0 };

    // Try exact match first
    variantPictureResult = await Variant.updateMany(
      { picture: oldPath },
      { $set: { picture: newUrl } }
    );
    variantIconResult = await Variant.updateMany(
      { icon: oldPath },
      { $set: { icon: newUrl } }
    );

    // If no exact match, try by filename
    if (variantPictureResult.modifiedCount === 0) {
      const allVariants = await Variant.find({
        picture: { $exists: true, $ne: null },
        picture: { $not: { $regex: '^https?://' } }
      });

      const matchingVariants = allVariants.filter(variant => {
        const dbPath = normalizePathForComparison(variant.picture);
        const dbFilename = getFilename(variant.picture);
        return dbPath === normalizedOldPath || dbFilename === filename;
      });

      if (matchingVariants.length > 0) {
        const variantIds = matchingVariants.map(v => v._id);
        variantPictureResult = await Variant.updateMany(
          { _id: { $in: variantIds } },
          { $set: { picture: newUrl } }
        );
      }
    }

    if (variantIconResult.modifiedCount === 0) {
      const allVariants = await Variant.find({
        icon: { $exists: true, $ne: null },
        icon: { $not: { $regex: '^https?://' } }
      });

      const matchingVariants = allVariants.filter(variant => {
        const dbPath = normalizePathForComparison(variant.icon);
        const dbFilename = getFilename(variant.icon);
        return dbPath === normalizedOldPath || dbFilename === filename;
      });

      if (matchingVariants.length > 0) {
        const variantIds = matchingVariants.map(v => v._id);
        variantIconResult = await Variant.updateMany(
          { _id: { $in: variantIds } },
          { $set: { icon: newUrl } }
        );
      }
    }

    if (variantPictureResult.modifiedCount > 0) {
      updates.push(`Variants (picture): ${variantPictureResult.modifiedCount} updated`);
    }
    if (variantIconResult.modifiedCount > 0) {
      updates.push(`Variants (icon): ${variantIconResult.modifiedCount} updated`);
    }
  } catch (error) {
    console.error(`Error updating Variants:`, error.message);
  }

  // Update Banners
  try {
    const bannerResult = await Banner.updateMany(
      { picture: oldPath },
      { $set: { picture: newUrl } }
    );
    if (bannerResult.modifiedCount > 0) {
      updates.push(`Banners: ${bannerResult.modifiedCount} updated`);
    }
  } catch (error) {
    console.error(`Error updating Banners:`, error.message);
  }

  // Update Blog
  try {
    const blogResult = await Blog.updateMany(
      { blogImage: oldPath },
      { $set: { blogImage: newUrl } }
    );
    if (blogResult.modifiedCount > 0) {
      updates.push(`Blog: ${blogResult.modifiedCount} updated`);
    }
  } catch (error) {
    console.error(`Error updating Blog:`, error.message);
  }

  // Update Partenaires
  try {
    const partenaireResult = await Partenaire.updateMany(
      { logo: oldPath },
      { $set: { logo: newUrl } }
    );
    if (partenaireResult.modifiedCount > 0) {
      updates.push(`Partenaires: ${partenaireResult.modifiedCount} updated`);
    }
  } catch (error) {
    console.error(`Error updating Partenaires:`, error.message);
  }

  return updates;
}

// Main migration function
async function migrateToS3() {
  const uploadsDir = path.join(__dirname, '../uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.error('❌ uploads directory not found');
    process.exit(1);
  }

  console.log('🚀 Starting migration to S3...');
  console.log('📸 Images will be automatically converted to WebP format for better performance\n');

  // Connect to MongoDB
  try {
    const mongoUri = process.env.Mongo_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables (Mongo_URI or MONGODB_URI)');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }

  // Get all files
  const allFiles = getAllFiles(uploadsDir);
  console.log(`📁 Found ${allFiles.length} files to migrate\n`);

  let successCount = 0;
  let errorCount = 0;
  const stats = {
    products: 0,
    variants: 0,
    banners: 0,
    blog: 0,
    partenaires: 0,
  };

  // Process files in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < allFiles.length; i += batchSize) {
    const batch = allFiles.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (filePath) => {
        try {
          // Get relative path from uploads directory
          const relativePath = path.relative(uploadsDir, filePath);
          // Normalize path separators for S3 (use forward slashes)
          const s3Key = relativePath.replace(/\\/g, '/');

          // Upload to S3 (will convert to WebP if it's an image)
          const s3Url = await uploadFileToS3(filePath, s3Key);

          // Update database references
          // Try different path formats that might be stored in DB
          const baseRelativePath = relativePath.replace(/\\/g, '/');
          const pathVariations = [
            baseRelativePath,
            baseRelativePath.replace('uploads/', ''),
            `uploads/${baseRelativePath}`,
            `./uploads/${baseRelativePath}`,
            filePath,
          ];

          // If image was converted to WebP, also try variations with original extension
          if (isImageFile(filePath)) {
            const originalExt = path.extname(filePath).toLowerCase();
            const webpPath = baseRelativePath.replace(new RegExp(`\\${originalExt}$`, 'i'), '.webp');
            pathVariations.push(
              webpPath,
              webpPath.replace('uploads/', ''),
              `uploads/${webpPath}`,
              `./uploads/${webpPath}`
            );
          }

          for (const oldPath of pathVariations) {
            const updates = await updateDatabaseReferences(oldPath, s3Url);
            if (updates.length > 0) {
              updates.forEach((update) => {
                const [model] = update.split(':');
                if (model.toLowerCase().includes('product')) stats.products++;
                if (model.toLowerCase().includes('variant')) stats.variants++;
                if (model.toLowerCase().includes('banner')) stats.banners++;
                if (model.toLowerCase().includes('blog')) stats.blog++;
                if (model.toLowerCase().includes('partenaire')) stats.partenaires++;
              });
            }
          }

          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✅ Processed ${successCount}/${allFiles.length} files...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing ${filePath}:`, error.message);
        }
      })
    );
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log('\n📝 Database Updates:');
  console.log(`   Products: ${stats.products}`);
  console.log(`   Variants: ${stats.variants}`);
  console.log(`   Banners: ${stats.banners}`);
  console.log(`   Blog: ${stats.blog}`);
  console.log(`   Partenaires: ${stats.partenaires}`);

  await mongoose.disconnect();
  console.log('\n✅ Migration completed!');
}

// Run migration
migrateToS3().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

