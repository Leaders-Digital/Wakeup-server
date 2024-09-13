const e = require("express");
const mongoose = require("mongoose");

// Define the schema for a single variant
const variantSchema = new mongoose.Schema({
  quantity: { type: Number },
  picture: { type: String },
  color: { type: String },
  icon: { type: String },
  reference: { type: String, required: true },
  codeAbarre: { type: String, unique: true },
});

// Define the schema for a product
const productSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  solde: { type: Boolean, default: false },
  mainPicture: { type: String },
  soldePourcentage: { type: Number },
  variants: [variantSchema], // Array of variants
  categorie: { 
    type: String, 
    enum: ['FACE', 'Brush', 'EYES', 'FACE AND BODY', 'BODY', 'HAIR', 'LIPS'], 
    required: true 
  }, // Add categorie enum
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
