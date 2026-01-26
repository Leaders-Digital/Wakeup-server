# Image Path Migration Guide

This guide explains how to fix incorrect image paths in your MongoDB database.

## Problem

Image paths in the database are stored with incorrect format:

### ❌ Wrong Format:
```
uploads\\products\\file-0b30bd3f7b95ab4d.jpg
```
- Using backslashes `\\`
- Missing leading slash `/`
- Won't work with frontend or Nginx

### ✅ Correct Format:
```
/uploads/products/file-0b30bd3f7b95ab4d.jpg
```
- Using forward slashes `/`
- Starting with `/uploads/`
- Works correctly with frontend and Nginx

## Solution

Run the migration script to fix all paths automatically.

## Before Running Migration

### 1. Backup Your Database
```bash
# Export products
mongoexport --uri="YOUR_MONGODB_URI" --collection=products --out=backup-products.json

# Export variants
mongoexport --uri="YOUR_MONGODB_URI" --collection=variants --out=backup-variants.json
```

### 2. Verify Connection
Make sure your `.env` file has the correct MongoDB URI:
```env
MONGODB_URI=mongodb+srv://...
# or
Mongo_URI=mongodb+srv://...
```

## Running the Migration

### Method 1: Using npm script (Recommended)
```bash
npm run fix:images
```

### Method 2: Direct execution
```bash
node scripts/fixImagePaths.js
```

## What the Script Does

1. **Connects to MongoDB** using your environment variables
2. **Fetches all products** from the database
3. **Fixes mainPicture paths** for each product:
   - Converts backslashes `\\` to forward slashes `/`
   - Adds leading `/` if missing
   - Skips already correct paths
   - Skips S3 URLs (if any remain)
4. **Fetches all variants** from the database
5. **Fixes picture and icon paths** for each variant
6. **Saves updated records** back to the database
7. **Shows summary** of changes

## Expected Output

```
🚀 Starting image path migration...

📦 Fixing Product mainPicture paths...
✅ Product 1/48: Blush
   Old: uploads\products\file-0b30bd3f7b95ab4d.jpg
   New: /uploads/products/file-0b30bd3f7b95ab4d.jpg
✅ Product 2/48: Beads Stars
   Old: uploads\products\file-c9c1eee414f97eea.png
   New: /uploads/products/file-c9c1eee414f97eea.png
...

📊 Products: 48/48 updated

🎨 Fixing Variant picture and icon paths...
✅ Variant 1/150 (REF001)
   Picture Old: uploads\products\file-abc123.webp
   Picture New: /uploads/products/file-abc123.webp
...

📊 Variants: 150/150 updated

============================================================
✅ MIGRATION COMPLETED SUCCESSFULLY!
============================================================
📦 Products updated: 48/48
🎨 Variants updated: 150/150
🎯 Total updated: 198/198
============================================================

✅ All done! Closing connection...
```

## Verification

After running the migration, verify the changes:

### 1. Check in Database
```javascript
// Using MongoDB shell or Compass
db.products.findOne({ nom: "Blush" })
// mainPicture should be: /uploads/products/file-xyz.jpg

db.variants.findOne({ reference: "REF001" })
// picture should be: /uploads/products/file-abc.webp
```

### 2. Test in Frontend
- Load your website
- Check if product images display correctly
- Check if variant images display correctly
- Open DevTools Network tab and verify image URLs

### 3. Test API Response
```bash
curl https://api.wakeup-cosmetics.tn/api/product/all?page=1&limit=10 \
  -H "x-api-key: AIzaSyD-1X6JQJ3Q"
```

Should return:
```json
{
  "products": [
    {
      "mainPicture": "/uploads/products/file-abc123.webp",
      ...
    }
  ]
}
```

## Troubleshooting

### Issue: Connection Error
```
❌ MongoDB Connection Error: ...
```

**Solution:** Check your `.env` file and MongoDB URI

### Issue: No Changes Made
```
📊 Products: 0/48 updated
```

**Solution:** Your paths might already be correct. Check one manually in the database.

### Issue: Some Paths Still Wrong
```
⚠️  Skipping S3 URL: https://bucket.s3.amazonaws.com/...
```

**Solution:** The script skips S3 URLs. If you have old S3 URLs, you may need to handle them separately or let them remain (they might still work).

## Rollback (If Needed)

If something goes wrong, restore from backup:

```bash
# Restore products
mongoimport --uri="YOUR_MONGODB_URI" --collection=products --file=backup-products.json --drop

# Restore variants
mongoimport --uri="YOUR_MONGODB_URI" --collection=variants --file=backup-variants.json --drop
```

## Path Format Rules

The migration script follows these rules:

1. **Backslashes → Forward slashes**
   - `uploads\\products\\` → `uploads/products/`

2. **Add leading slash**
   - `uploads/products/` → `/uploads/products/`

3. **Skip if already correct**
   - `/uploads/products/file.webp` → (no change)

4. **Skip S3 URLs**
   - `https://...` → (no change)

## After Migration

1. ✅ All product `mainPicture` paths start with `/uploads/`
2. ✅ All variant `picture` paths start with `/uploads/`
3. ✅ All variant `icon` paths start with `/uploads/`
4. ✅ Frontend can display images correctly
5. ✅ Nginx serves static files correctly

## Integration with CI/CD

The migration script can be added to your deployment process:

```yaml
# In .github/workflows/deploy.yml
- name: Run migrations
  run: |
    cd /home/ubuntu/wakeup-backend
    npm run fix:images
```

But be careful! This should only be run once. After the initial fix, all new uploads will use the correct format automatically.

## Summary

| Field | Collection | Status |
|-------|-----------|--------|
| `mainPicture` | products | ✅ Fixed |
| `picture` | variants | ✅ Fixed |
| `icon` | variants | ✅ Fixed |
| `blogImage` | blogs | ℹ️ Add if needed |
| `logo` | partenaires | ℹ️ Add if needed |
| `picture` | banners | ℹ️ Add if needed |

If you need to fix other collections (blogs, partenaires, banners), you can modify the script to include them.

## Questions?

Run the script and check the output. It will show you exactly what it's doing and provide a summary at the end.

**Remember:** Always backup before running migrations! 🔒

