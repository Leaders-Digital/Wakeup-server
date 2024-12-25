const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" }, // Reference to Variant
  quantite: { type: Number, required: true }, // Quantity of the product
});

const VenteSchema = new mongoose.Schema(
  {
    numFacture: {
      type: String,
      required: true,
    }, // Invoice number

    products: {
      type: [ProductSchema],
      required: true,
    }, // Array of products
    totalPrixAchat: {
      type: Number,
      required: true,
    }, // Calculated total price
    status: {
      type: String,
      enum: ["en attente", "terminé", "annulé"],
      default: "en attente",
    }, // Status of the sale (in French)
    clientType: {
      type: String,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    entreprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partenaire",
    },
    priceType: { type: String, required: true },
    totalPrice: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vente", VenteSchema);
