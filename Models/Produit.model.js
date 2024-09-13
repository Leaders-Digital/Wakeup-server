const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  solde: { type: Boolean, default: false },
  soldePourcentage: { type: Number },
  varient: {
    quantity: { type: Number },
    picture: { type: String },
    color: { type: String },
    icon: { type: String },
    reference: { type: String, required: true },
    codeAbarre: { type: String, unique: true },
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
