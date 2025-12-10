require('dotenv').config();
const mongoose = require('mongoose');
require('../Models/index');

// Import models
const Product = require('../Models/Produit.model');
const Variant = require('../Models/variant.model');
const Banner = require('../Models/banner.model');
const Blog = require('../Models/blog.model');
const Partenaire = require('../Models/Partenaire.model');
const fs = require('fs');
const path = require('path');

async function checkMigration() {
  const uploadsDir = path.join(__dirname, '../uploads');

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

  console.log('🔍 Checking migration status...\n');

  // Check Products
  console.log('📦 Checking Products...');
  const products = await Product.find({ mainPicture: { $exists: true, $ne: null } });
  let productsNotMigrated = 0;
  let productsMigrated = 0;

  for (const product of products) {
    const picturePath = product.mainPicture;
    if (picturePath) {
      // Check if it's an S3 URL
      if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
        productsMigrated++;
      } else {
        // Check if file exists locally
        const localPath = path.join(uploadsDir, picturePath.replace(/^\.\//, '').replace(/^uploads\//, ''));
        if (fs.existsSync(localPath)) {
          productsNotMigrated++;
          console.log(`   ⚠️  Product "${product.nom}" (${product._id}): ${picturePath}`);
        } else {
          console.log(`   ❓ Product "${product.nom}" (${product._id}): ${picturePath} - File not found locally`);
        }
      }
    }
  }
  console.log(`   ✅ Migrated: ${productsMigrated}, ⚠️  Not migrated: ${productsNotMigrated}\n`);

  // Check Variants
  console.log('🎨 Checking Variants...');
  const variants = await Variant.find({
    $or: [
      { picture: { $exists: true, $ne: null } },
      { icon: { $exists: true, $ne: null } }
    ]
  });
  let variantsNotMigrated = 0;
  let variantsMigrated = 0;

  for (const variant of variants) {
    const fields = ['picture', 'icon'];
    for (const field of fields) {
      const filePath = variant[field];
      if (filePath) {
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          variantsMigrated++;
        } else {
          const localPath = path.join(uploadsDir, filePath.replace(/^\.\//, '').replace(/^uploads\//, ''));
          if (fs.existsSync(localPath)) {
            variantsNotMigrated++;
            console.log(`   ⚠️  Variant ${variant._id} (${field}): ${filePath}`);
          }
        }
      }
    }
  }
  console.log(`   ✅ Migrated: ${variantsMigrated}, ⚠️  Not migrated: ${variantsNotMigrated}\n`);

  // Check Banners
  console.log('🖼️  Checking Banners...');
  const banners = await Banner.find({ picture: { $exists: true, $ne: null } });
  let bannersNotMigrated = 0;
  let bannersMigrated = 0;

  for (const banner of banners) {
    const picturePath = banner.picture;
    if (picturePath) {
      if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
        bannersMigrated++;
      } else {
        const localPath = path.join(uploadsDir, picturePath.replace(/^\.\//, '').replace(/^uploads\//, ''));
        if (fs.existsSync(localPath)) {
          bannersNotMigrated++;
          console.log(`   ⚠️  Banner "${banner.name}": ${picturePath}`);
        }
      }
    }
  }
  console.log(`   ✅ Migrated: ${bannersMigrated}, ⚠️  Not migrated: ${bannersNotMigrated}\n`);

  // Check Blog
  console.log('📝 Checking Blog...');
  const blogs = await Blog.find({ blogImage: { $exists: true, $ne: null } });
  let blogsNotMigrated = 0;
  let blogsMigrated = 0;

  for (const blog of blogs) {
    const imagePath = blog.blogImage;
    if (imagePath) {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        blogsMigrated++;
      } else {
        const localPath = path.join(uploadsDir, imagePath.replace(/^\.\//, '').replace(/^uploads\//, ''));
        if (fs.existsSync(localPath)) {
          blogsNotMigrated++;
          console.log(`   ⚠️  Blog "${blog.title}": ${imagePath}`);
        }
      }
    }
  }
  console.log(`   ✅ Migrated: ${blogsMigrated}, ⚠️  Not migrated: ${blogsNotMigrated}\n`);

  // Check Partenaires
  console.log('🤝 Checking Partenaires...');
  const partenaires = await Partenaire.find({ logo: { $exists: true, $ne: null } });
  let partenairesNotMigrated = 0;
  let partenairesMigrated = 0;

  for (const partenaire of partenaires) {
    const logoPath = partenaire.logo;
    if (logoPath) {
      if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
        partenairesMigrated++;
      } else {
        const localPath = path.join(uploadsDir, logoPath.replace(/^\.\//, '').replace(/^uploads\//, ''));
        if (fs.existsSync(localPath)) {
          partenairesNotMigrated++;
          console.log(`   ⚠️  Partenaire "${partenaire.nom}": ${logoPath}`);
        }
      }
    }
  }
  console.log(`   ✅ Migrated: ${partenairesMigrated}, ⚠️  Not migrated: ${partenairesNotMigrated}\n`);

  console.log('📊 Summary:');
  console.log(`   Total Products: ${products.length}`);
  console.log(`   Total Variants: ${variants.length}`);
  console.log(`   Total Banners: ${banners.length}`);
  console.log(`   Total Blog posts: ${blogs.length}`);
  console.log(`   Total Partenaires: ${partenaires.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Check completed!');
}

checkMigration().catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});

