const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a product
const productSchema = new Schema({
  nom: { type: String, required: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true },
  solde: { type: Boolean, default: false },
  mainPicture: { type: String },
  soldePourcentage: { type: Number },
  variants: [{ type: Schema.Types.ObjectId, ref: 'Variant' }], // Array of variant references
  retings: [{ type: Schema.Types.ObjectId, ref: 'Review' }], // Array of variant references
  categorie: {
    type: String,
    enum: ["FACE", "Brush", "EYES", "FACE AND BODY", "BODY", "HAIR", "LIPS"],
    required: true,
  },
  subCategorie: {
    type: String,
    enum: [
      "Foundation",
      "Concealer",
      "Powder",
      "Primer",
      "Setting Spray",
      "Highlighter",
      "Bronzer",
      "Blush",
      "Contour",
      "Brush",
      "Mascara",
      "Eyeliner",
      "Eyeshadow",
      "Eyebrow",
      "False Lashes",
      "Eye Primer",
      "Eye Sets",
      "Face Palette",
      "Lipstick",
      "Lip Gloss",
      "Lip Liner",
      "Lip Sets",
      "Hair",
      "Hair Tools",
      "Hair Sets",
      "Body",
      "Body Care",
      "Body Sets",
    ],
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
