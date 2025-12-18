require('dotenv').config();
const mongoose = require('mongoose');
require('../Models/index');

// Import Product model
const Product = require('../Models/Produit.model');

async function resetSoldePourcentage() {
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

  try {
    console.log('🔄 Resetting solde to false and soldePourcentage to 0 for all products...\n');

    // Update all products to set solde to false and soldePourcentage to 0
    const result = await Product.updateMany(
      {},
      { $set: { solde: false, soldePourcentage: 0 } }
    );

    console.log('📊 Update Summary:');
    console.log(`   ✅ Matched products: ${result.matchedCount}`);
    console.log(`   ✅ Modified products: ${result.modifiedCount}`);
    console.log(`   ✅ Unchanged products: ${result.matchedCount - result.modifiedCount}`);

    // Get count of products that still have solde = true or soldePourcentage != 0
    const productsWithSolde = await Product.countDocuments({
      $or: [
        { solde: { $ne: false } },
        { soldePourcentage: { $exists: true, $ne: 0, $ne: null } }
      ]
    });

    if (productsWithSolde > 0) {
      console.log(`\n⚠️  Warning: ${productsWithSolde} products still have solde = true or soldePourcentage != 0`);
      console.log('   This might indicate the update did not work as expected.');
    } else {
      console.log('\n✅ All products now have solde = false and soldePourcentage = 0');
    }

    await mongoose.disconnect();
    console.log('\n✅ Update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating products:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
resetSoldePourcentage().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

