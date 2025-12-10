require('dotenv').config();
const mongoose = require('mongoose');
require('../Models/index');

// Import models
const Product = require('../Models/Produit.model');
const Variant = require('../Models/variant.model');
const { generateUniqueHandle } = require('../helpers/handleGenerator');

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

// Migration function
const updateMainPictureFromVariant = async () => {
  try {
    console.log('🔄 Début de la migration: Mise à jour des mainPicture et génération des handles...\n');

    // Get all products
    const products = await Product.find({}).populate('variants');

    console.log(`📦 ${products.length} produits trouvés\n`);

    let updatedCount = 0;
    let handleUpdatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Skip if product has no variants
        if (!product.variants || product.variants.length === 0) {
          console.log(`⏭️  Produit "${product.nom}" (${product._id}) - Aucun variant, ignoré`);
          skippedCount++;
          continue;
        }

        // Skip if product is a PACK (they might have different logic)
        if (product.categorie === 'PACK') {
          console.log(`⏭️  Produit "${product.nom}" (${product._id}) - PACK, ignoré`);
          skippedCount++;
          continue;
        }

        // Find the first variant with a picture
        // Prefer variants with quantity > 0
        let firstVariant = null;
        
        // First, try to find a variant with quantity > 0 and picture
        firstVariant = product.variants.find(v => {
          const variant = v._doc || v;
          return variant.quantity > 0 && variant.picture;
        });

        // If not found, get any variant with a picture
        if (!firstVariant) {
          firstVariant = product.variants.find(v => {
            const variant = v._doc || v;
            return variant.picture;
          });
        }

        // If still not found, get the first variant
        if (!firstVariant) {
          firstVariant = product.variants[0];
        }

        if (!firstVariant) {
          console.log(`⚠️  Produit "${product.nom}" (${product._id}) - Aucun variant valide trouvé`);
          skippedCount++;
          continue;
        }

        // Extract the picture from variant
        const variant = firstVariant._doc || firstVariant;
        const variantPicture = variant.picture;

        if (!variantPicture) {
          console.log(`⚠️  Produit "${product.nom}" (${product._id}) - Variant sans picture`);
          skippedCount++;
          continue;
        }

        // Check if mainPicture is already the same as variant picture
        if (product.mainPicture === variantPicture) {
          console.log(`✓ Produit "${product.nom}" (${product._id}) - mainPicture déjà à jour`);
          skippedCount++;
          continue;
        }

        // Update the product's mainPicture
        let needsSave = false;
        
        if (product.mainPicture !== variantPicture) {
          product.mainPicture = variantPicture;
          needsSave = true;
        }

        // Generate and set handle if it doesn't exist
        if (!product.handle) {
          const uniqueHandle = await generateUniqueHandle(product.nom, product._id);
          product.handle = uniqueHandle;
          needsSave = true;
          handleUpdatedCount++;
          console.log(`   📝 Handle généré: ${uniqueHandle}`);
        }

        // Save if there are changes
        if (needsSave) {
          await product.save();
          
          if (product.mainPicture === variantPicture) {
            console.log(`✅ Produit "${product.nom}" (${product._id}) - mainPicture mis à jour: ${variantPicture.substring(0, 50)}...`);
            updatedCount++;
          } else {
            console.log(`✅ Produit "${product.nom}" (${product._id}) - Handle généré`);
          }
        } else {
          console.log(`✓ Produit "${product.nom}" (${product._id}) - Déjà à jour`);
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ Erreur pour le produit "${product.nom}" (${product._id}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Produits avec mainPicture mis à jour: ${updatedCount}`);
    console.log(`   📝 Produits avec handle généré: ${handleUpdatedCount}`);
    console.log(`   ⏭️  Produits ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📦 Total: ${products.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await updateMainPictureFromVariant();
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

module.exports = { updateMainPictureFromVariant };

