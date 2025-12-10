require('dotenv').config();
const mongoose = require('mongoose');
require('../Models/index');

// Import models
const Product = require('../Models/Produit.model');
const { generateHandle, generateUniqueHandle } = require('../helpers/handleGenerator');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.Mongo_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ Variable d\'environnement MongoDB non trouvée (Mongo_URI, MONGODB_URI ou MONGO_URI)');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Migration function to generate handles
const generateHandles = async () => {
  try {
    console.log('🔄 Début de la migration: Génération des handles SEO-friendly...\n');

    // Get all products without handles
    const products = await Product.find({ $or: [{ handle: { $exists: false } }, { handle: null }, { handle: '' }] });

    console.log(`📦 ${products.length} produits sans handle trouvés\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        if (!product.nom) {
          console.log(`⚠️  Produit ${product._id} - Pas de nom, ignoré`);
          skippedCount++;
          continue;
        }

        // Generate unique handle
        const uniqueHandle = await generateUniqueHandle(product.nom, product._id);
        
        // Update the product's handle
        product.handle = uniqueHandle;
        await product.save();

        console.log(`✅ Produit "${product.nom}" (${product._id}) - Handle généré: ${uniqueHandle}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Erreur pour le produit "${product.nom}" (${product._id}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Produits avec handle généré: ${updatedCount}`);
    console.log(`   ⏭️  Produits ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total traité: ${products.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await generateHandles();
    console.log('\n✅ Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration échouée:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { generateHandles };

