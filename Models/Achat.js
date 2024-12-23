const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" }, // Reference to Variant
  quantite: { type: Number, required: true }, // Quantity of the product
});

const AchatSchema = new mongoose.Schema(
  {
    numFacture: { type: String, required: true }, // Invoice number
    products: { type: [ProductSchema], required: true }, // Array of products
    totalPrixAchat: { type: Number, required: true }, // Calculated total price
    isValidated: { type: Boolean, default: false }, // Calculated total price
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Achat", AchatSchema);  
