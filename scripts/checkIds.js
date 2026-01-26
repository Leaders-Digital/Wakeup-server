const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('../Models/Produit.model');

async function checkIds() {
  try {
    await mongoose.connect(process.env.Mongo_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../test.products.json'), 'utf8'));
    
    console.log(`Backup has ${productsData.length} products`);
    console.log(`First product in backup:`);
    console.log(`  ID: ${JSON.stringify(productsData[0]._id)}`);
    console.log(`  Name: ${productsData[0].nom}`);
    console.log(`  MainPicture: ${productsData[0].mainPicture}`);
    
    // Try to find it
    const productId = productsData[0]._id?.$oid || productsData[0]._id;
    console.log(`\nLooking for product with ID: ${productId}`);
    
    const found = await Product.findById(productId);
    if (found) {
      console.log(`\n✅ Found in DB:`);
      console.log(`  Name: ${found.nom}`);
      console.log(`  MainPicture: ${found.mainPicture}`);
    } else {
      console.log(`\n❌ NOT FOUND in database`);
      
      // Try by name
      const byName = await Product.findOne({ nom: productsData[0].nom });
      if (byName) {
        console.log(`\n⚠️  Found by name instead:`);
        console.log(`  ID: ${byName._id}`);
        console.log(`  MainPicture: ${byName.mainPicture}`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkIds();

