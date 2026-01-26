const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../Models/Produit.model');
const Variant = require('../Models/variant.model');

async function checkPaths() {
  try {
    await mongoose.connect(process.env.Mongo_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check a few products
    const products = await Product.find().limit(5).select('nom mainPicture');
    console.log('📦 Sample Products:');
    products.forEach(p => {
      console.log(`   ${p.nom}: ${p.mainPicture}`);
    });

    // Check a few variants
    const variants = await Variant.find().limit(5).select('reference picture icon');
    console.log('\n🎨 Sample Variants:');
    variants.forEach(v => {
      console.log(`   ${v.reference}:`);
      console.log(`      Picture: ${v.picture}`);
      console.log(`      Icon: ${v.icon}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaths();

