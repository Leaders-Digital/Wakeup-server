# File Path Format Documentation

## ✅ Correct Path Format

All file paths saved in the database **MUST** start with `/uploads/`

### Examples of Correct Paths:

```javascript
// Product images
/uploads/products/file-a3f2d8e1b9c4.webp

// Blog images
/uploads/blog/file-7d9e2c4f8a1b.webp

// Banner images
/uploads/banners/file-5c1a9d3e7b2f.webp

// Partenaire logos
/uploads/partenaires/logo-9f4e2a6d8c1b.webp

// Root uploads (when no folder specified)
/uploads/1737886420000-image.webp
```

## 📁 Folder Structure

### On Disk:
```
Wakeup-server/
└── uploads/
    ├── products/
    │   ├── file-a3f2d8e1b9c4.webp
    │   └── file-b5d3e9f2c8a7.webp
    ├── blog/
    │   └── file-7d9e2c4f8a1b.webp
    ├── banners/
    │   └── file-5c1a9d3e7b2f.webp
    ├── partenaires/
    │   └── logo-9f4e2a6d8c1b.webp
    └── 1737886420000-image.webp
```

### In Database:
```javascript
{
  mainPicture: "/uploads/products/file-a3f2d8e1b9c4.webp",
  blogImage: "/uploads/blog/file-7d9e2c4f8a1b.webp",
  picture: "/uploads/banners/file-5c1a9d3e7b2f.webp",
  logo: "/uploads/partenaires/logo-9f4e2a6d8c1b.webp"
}
```

## 🔧 How It Works

### Multer Configuration

**File: `Middleware/s3Upload.js`**

```javascript
uploadFile({
  folder: "products",     // Subfolder within uploads
  fieldName: "mainPicture",
  fileName: "file",
  multiple: false
})
```

This will save:
- **Disk**: `uploads/products/file-{random}.webp`
- **Database**: `/uploads/products/file-{random}.webp`

### If No Folder Specified:

```javascript
uploadFile({
  fieldName: "image"
})
```

This will save:
- **Disk**: `uploads/{timestamp}-{filename}.webp`
- **Database**: `/uploads/{timestamp}-{filename}.webp`

## 📋 Current Folder Mappings

| Route | Folder | Database Field | Example Path |
|-------|--------|----------------|--------------|
| Product (main) | `products` | `mainPicture` | `/uploads/products/file-abc123.webp` |
| Product (variant) | `products` | `picture`, `icon` | `/uploads/products/file-def456.webp` |
| Blog | `blog` | `blogImage` | `/uploads/blog/file-ghi789.webp` |
| Banner | `banners` | `picture` | `/uploads/banners/file-jkl012.webp` |
| Partenaire | `partenaires` | `logo` | `/uploads/partenaires/logo-mno345.webp` |

## 🌐 Frontend Usage

### Direct URL Construction:

```javascript
// The path stored in DB already has /uploads/
const imageUrl = `${process.env.NEXT_PUBLIC_API_KEY}${product.mainPicture}`;
// Result: https://api.wakeup-cosmetics.tn/uploads/products/file-abc123.webp
```

### Using imageUrl Helper:

```javascript
import { getImageUrl } from 'utils/imageUrl';

const imageUrl = getImageUrl(product.mainPicture);
// Input: /uploads/products/file-abc123.webp
// Output: https://api.wakeup-cosmetics.tn/uploads/products/file-abc123.webp
```

## ✅ Path Validation

All paths in the database should:
1. ✅ Start with `/uploads/`
2. ✅ Use forward slashes `/` (not backslashes `\`)
3. ✅ End with file extension (usually `.webp`)
4. ✅ Be URL-safe (no spaces, special characters)

### Examples:

```javascript
// ✅ CORRECT
"/uploads/products/file-a3f2d8e1.webp"
"/uploads/blog/file-7d9e2c4f.webp"
"/uploads/1737886420000-image.webp"

// ❌ INCORRECT
"uploads/products/file.webp"           // Missing leading /
"/products/file.webp"                  // Missing /uploads/
"\\uploads\\products\\file.webp"       // Using backslashes
"https://s3.../uploads/file.webp"      // Absolute S3 URL (old format)
```

## 🔍 Debugging

### Check Saved Path:

```javascript
console.log('✅ File saved:', req.file.path);
// Expected output: /uploads/products/file-a3f2d8e1b9c4.webp
```

### Verify in Database:

```javascript
const product = await Product.findById(id);
console.log(product.mainPicture);
// Expected: /uploads/products/file-a3f2d8e1b9c4.webp
```

### Test Frontend Access:

```bash
curl https://api.wakeup-cosmetics.tn/uploads/products/file-a3f2d8e1b9c4.webp
# Should return the image file
```

## 🚀 Migration from S3

If you have old S3 URLs in your database:

```javascript
// Old S3 format:
"https://bucket.s3.amazonaws.com/uploads/file.webp"

// New local format:
"/uploads/file.webp"
```

Run a migration script to update all paths to the new format.

## 📝 Notes

1. **All images are automatically converted to WebP** format (except PDFs and videos)
2. **File size limit**: 50 MB (configurable in Nginx and Express)
3. **Unique filenames**: Generated using crypto random bytes or timestamps
4. **Static serving**: Nginx serves files directly from `/uploads/` for better performance
5. **Path consistency**: Always use `/uploads/` prefix for database storage

## 🛠️ Troubleshooting

### Issue: Image not loading in frontend

**Check:**
1. Path starts with `/uploads/` in database
2. File exists on disk in correct location
3. Nginx is serving static files correctly
4. API URL is correct in frontend env vars

### Issue: 404 Not Found

```bash
# Verify file exists
ls -la /home/ubuntu/wakeup-backend/uploads/products/

# Check Nginx config
sudo nginx -t

# Check file permissions
sudo chmod -R 755 /home/ubuntu/wakeup-backend/uploads/
```

### Issue: Wrong path in database

```javascript
// If you see paths like:
"/products/file.webp"  // Missing /uploads/

// Update them:
await Product.updateMany(
  { mainPicture: { $regex: "^/products/" } },
  [{ $set: { mainPicture: { $concat: ["/uploads", "$mainPicture"] } } }]
);
```

## ✅ Summary

- **Always** prefix paths with `/uploads/` when saving to database
- **Disk structure**: `uploads/{folder}/{filename}`
- **Database format**: `/uploads/{folder}/{filename}`
- **Frontend URL**: `https://api.wakeup-cosmetics.tn/uploads/{folder}/{filename}`
- **Path format is consistent** across all file types and controllers

