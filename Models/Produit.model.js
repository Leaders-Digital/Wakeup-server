const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  reference: { type: String, required: true },
  prix: { type: Number, required: true },
  solde: { type: Boolean, default: false },
  soldePourcentage: { type: Number },
  varient: { type: String },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
