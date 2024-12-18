const cron = require("node-cron");
const axios = require("axios");
const Product = require("../Models/Produit.model");
const Variant = require("../Models/variant.model");

// Define the function to update prices and stock
const updatePrices = async () => {
  try {
    const variants = await Variant.find();
    console.log("Total Variants:", variants.length);

    const uniqueVariants = [];
    const seenProducts = new Set();

    for (const variant of variants) {
      const product = await Product.findOne({ variants: variant._id });
      if (!seenProducts.has(product.nom)) {
        seenProducts.add(product.nom);
        uniqueVariants.push(variant);
      }
    }

    const config = {
      headers: {
        Authorization: "jkaAVXs852ZPOnlop795",
        "Content-Type": "application/json",
      },
    };

    for (const [index, variant] of uniqueVariants.entries()) {
      const body = {
        code: variant.codeAbarre,
      };
      try {
        const response = await axios.post(
          "https://expert.leaders-immo.com/api/makeup/article/price",
          body,
          config
        );

        const newPrice = response.data.resultat;
        const newStock = response.data.stock; // Assuming stock is in response

        const product = await Product.findOneAndUpdate(
          { variants: variant._id },
          { $set: { prix: newPrice, stock: newStock } }, // Update both price and stock
          { new: true }
        );

        console.log(
          `Updated price and stock for ${product.nom} (${variant.codeAbarre}): Price - ${product.prix}, Stock - ${newStock}`
        );
      } catch (error) {
        console.error(
          `Error for variant at index ${index} (${variant.codeAbarre}):`,
          error.message
        );
      }
    }
    console.log("Price and stock update complete.");
  } catch (error) {
    console.error("Error during price update:", error);
  }
};
const updateAllVariants = async () => {
  try {
    const variants = await Variant.find();
    console.log("Total Variants:", variants.length);

    const config = {
      headers: {
        Authorization: "jkaAVXs852ZPOnlop795",
        "Content-Type": "application/json",
      },
    };

    let updatedCount = 0; // Track updated products
    let unrecognizedCount = 0; // Track products not recognized by the API

    // Use a for...of loop with async/await for sequential processing
    for (const [index, variant] of variants.entries()) {
      const body = {
        code: variant.codeAbarre,
      };

      try {
        const response = await axios.post(
          "https://expert.leaders-immo.com/api/makeup/article/stock",
          body,
          config
        );

        const { resultat, status } = response.data;
        if (status === "success") {
          if (variant.quantity !== resultat) {
            // Update quantity if it differs
            variant.quantity = resultat;
            await variant.save();
            updatedCount++;
            console.log(
              `Updated variant at index ${index} (${variant.codeAbarre}): New quantity is ${resultat}`
            );
          } else {
            console.log(
              `Same quantity for variant at index ${index} (${variant.codeAbarre}): Quantity is ${resultat}`
            );
          }
        } else {
          // Handle unrecognized products
          console.log(
            `API did not recognize variant at index ${index} (${variant.codeAbarre})`
          );
          unrecognizedCount++;
        }
      } catch (error) {
        console.error(
          `Error for variant at index ${index} (${variant.codeAbarre}):`,
          error
        );
        unrecognizedCount++;
      }
    }

    console.log({
      message: "Variants updated successfully",
      totalVariants: variants.length,
      updatedCount,
      unrecognizedCount,
    });
  } catch (error) {
    console.error(error);
    console.log.json({ message: "Server error", error });
  }
};

// Schedule the cron job to run every hour
console.log("Scheduling hourly price and stock Connected...");

cron.schedule("0 * * * *", () => {
  console.log("Running hourly price and stock update...");
  updatePrices();
  updateAllVariants();
});

module.exports = { updatePrices, updateAllVariants };
