const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('../Models/Produit.model');
const Variant = require('../Models/variant.model');

const MONGODB_URI = process.env.Mongo_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/wakeup-db';

async function fixImagePaths() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected\n');

    // Read backup files
    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../test.products.json'), 'utf8'));
    const variantsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../test.variants.json'), 'utf8'));

    console.log('🚀 Starting FULL image path replacement from backup...\n');

    // Helper to normalize path
    const normalizePath = (p) => {
      if (!p) return null;
      let normalized = p.replace(/\\/g, '/'); // Replace backslashes with forward slashes
      if (!normalized.startsWith('/uploads/')) {
        // Extract just the filename part after any "uploads" folder
        if (normalized.includes('/uploads/')) {
          normalized = `/uploads/${normalized.split('/uploads/').pop()}`;
        } else if (normalized.startsWith('uploads/')) {
          normalized = `/${normalized}`;
        } else {
          // If it's just a filename, put it in /uploads/
          normalized = `/uploads/${normalized.split('/').pop()}`;
        }
      }
      return normalized;
    };

    // Update Products - FORCE REPLACE ALL PATHS
    let productsUpdated = 0;
    let productsNotFound = 0;
    console.log(`📦 Processing ${productsData.length} products from backup...\n`);
    
    for (const product of productsData) {
      // Handle MongoDB export format: { "$oid": "..." }
      const productId = product._id?.$oid || product._id;
      const existingProduct = await Product.findById(productId);
      if (existingProduct) {
        const newMainPicture = normalizePath(product.mainPicture);
        const oldMainPicture = existingProduct.mainPicture;
        
        // ALWAYS UPDATE - replace ANY path (S3, local, etc.) with backup path
        if (oldMainPicture !== newMainPicture) {
          existingProduct.mainPicture = newMainPicture;
          await existingProduct.save();
          productsUpdated++;
          console.log(`✅ Updated Product "${existingProduct.nom}"`);
          console.log(`   Old: ${oldMainPicture}`);
          console.log(`   New: ${newMainPicture}\n`);
        }
      } else {
        productsNotFound++;
        console.log(`⚠️  Product not found in DB: ${product._id}`);
      }
    }
    
    console.log(`\n📊 Products Summary:`);
    console.log(`   Updated: ${productsUpdated}`);
    console.log(`   Not Found: ${productsNotFound}`);
    console.log(`   Total in Backup: ${productsData.length}\n`);

    // Update Variants - FORCE REPLACE ALL PATHS
    let variantsUpdated = 0;
    let variantsNotFound = 0;
    console.log(`\n🎨 Processing ${variantsData.length} variants from backup...\n`);
    
    for (const variant of variantsData) {
      // Handle MongoDB export format: { "$oid": "..." }
      const variantId = variant._id?.$oid || variant._id;
      const existingVariant = await Variant.findById(variantId);
      if (existingVariant) {
        const newPicture = normalizePath(variant.picture);
        const newIcon = normalizePath(variant.icon);
        const oldPicture = existingVariant.picture;
        const oldIcon = existingVariant.icon;

        let changed = false;
        let changes = [];
        
        // ALWAYS UPDATE - replace ANY path with backup path
        if (oldPicture !== newPicture && newPicture !== null) {
          existingVariant.picture = newPicture;
          changes.push(`Picture: ${oldPicture} → ${newPicture}`);
          changed = true;
        }
        if (oldIcon !== newIcon && newIcon !== null) {
          existingVariant.icon = newIcon;
          changes.push(`Icon: ${oldIcon} → ${newIcon}`);
          changed = true;
        }

        if (changed) {
          await existingVariant.save();
          variantsUpdated++;
          console.log(`✅ Updated Variant "${existingVariant.reference}"`);
          changes.forEach(change => console.log(`   ${change}`));
          console.log('');
        }
      } else {
        variantsNotFound++;
        console.log(`⚠️  Variant not found in DB: ${variant._id}`);
      }
    }
    
    console.log(`\n📊 Variants Summary:`);
    console.log(`   Updated: ${variantsUpdated}`);
    console.log(`   Not Found: ${variantsNotFound}`);
    console.log(`   Total in Backup: ${variantsData.length}\n`);

    console.log('='.repeat(60));
    console.log('✅ MIGRATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📦 Products updated: ${productsUpdated}/${productsData.length}`);
    console.log(`🎨 Variants updated: ${variantsUpdated}/${variantsData.length}`);
    console.log(`🎯 Total updated: ${productsUpdated + variantsUpdated}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during image path migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 MongoDB connection closed\n');
  }
}

fixImagePaths();
