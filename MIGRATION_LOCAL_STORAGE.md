# Migration from S3 to Local Storage with Multer

This document describes the migration from Amazon S3 storage to local file storage using Multer.

## Changes Made

### 1. Middleware Updates

**Files Modified:**
- `Middleware/s3Upload.js` - Converted to use local disk storage instead of S3
- `Middleware/s3UploadSimple.js` - Converted to use local disk storage instead of S3
- `Middleware/imageUpload.js` - Now uses local storage wrapper
- `Middleware/upload.js` - Now uses local storage wrapper

**Features Retained:**
- ✅ WebP image conversion (using Sharp)
- ✅ File type validation
- ✅ Unique filename generation
- ✅ Multiple file uploads support
- ✅ 10MB file size limit

### 2. Controller Updates

All controllers have been updated to use `req.file.path` instead of `req.file.location`:

- `Controllers/Blog.controller.js` - Updated blog image handling
- `Controllers/banner.controller.js` - Updated banner picture handling
- `Controllers/Produit.controller.js` - Updated product images and variant pictures/icons
- `Controllers/Partenaire.controller.js` - Updated partner logo handling

**Removed:**
- S3 signed URL transformation
- S3 helper imports
- Mongoose plain object conversion (where not needed)

### 3. Dependencies Removed

**Removed from package.json:**
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `multer-s3`

**Removed npm scripts:**
- `migrate:s3`
- `check:migration`

### 4. Files Deleted

- `helpers/s3Helper.js` - S3 URL signing helper
- `scripts/migrateToS3.js` - S3 migration script
- `scripts/checkMigration.js` - S3 migration checker
- `scripts/README.md` - S3 migration documentation
- `MIGRATION_S3.md` - S3 migration guide

### 5. Storage Configuration

**Upload Directory:** `uploads/` (created automatically if doesn't exist)

**File Structure:**
```
uploads/
├── uploads/           # Default folder for simple uploads
│   └── {timestamp}-{filename}.webp
└── {custom-folder}/   # Custom folders from uploadFile config
    └── {fileName}-{random-hex}.webp
```

**Static File Serving:**
Files are accessible via `/uploads/` route (already configured in `index.js` line 28)

## Environment Variables

**Remove these from your `.env` file:**
```env
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME
```

## File URL Format

**Before (S3):**
```javascript
https://bucket-name.s3.us-east-1.amazonaws.com/uploads/file-123.webp
```

**After (Local):**
```javascript
/uploads/file-123.webp
```

Files are now stored locally and served via Express static middleware.

## Advantages of Local Storage

✅ **No AWS costs** - No S3 storage or bandwidth costs
✅ **Simpler deployment** - No AWS credentials needed
✅ **Faster development** - No network latency for uploads
✅ **Direct file access** - Files are on the same server
✅ **No external dependencies** - No AWS service dependencies

## Important Notes

1. **Docker Volume:** Ensure the `uploads` directory is mounted as a volume in Docker to persist files across container restarts (already configured in `docker-compose.yml`)

2. **Backup:** Consider implementing a backup strategy for the uploads folder

3. **CDN (Optional):** For production at scale, you might want to use a CDN in front of your server to cache and serve static files more efficiently

4. **Disk Space:** Monitor disk space usage as files are now stored locally

## Installation

To remove AWS dependencies, run:
```bash
npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
```

The `sharp` package is still used for image conversion to WebP format.

## Testing

Test file uploads in these areas:
- Blog articles (blogImage)
- Product main pictures
- Product variants (picture, icon)
- Partner logos
- Banners

All file paths are now relative paths starting with `/` that can be directly used in the frontend.

