const mongoose = require("mongoose");
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
  metaFields:[{type:String,required:false}],
  categorie: {
    type: String,
    enum: ["FACE", "Brush", "EYES", "Produits de soin", "LIPS","PACK"],
    required: true,
  },
  subCategorie: {
    type: String,
    enum: [
      "FONDATIONS",
      "BB CREAM",
      "BLUSH",  
      "HIGHLIGHTER",
      "BRONZER & POWDER",
      "PRIMER",
      "FIXER",
      "MASCARA",
      "CONCEALER",
      "EYESHADOW",
      "EYELINER",
      "EYE PENCILS",
      "EYE BROW",
      "LIPSTICK",
      "LIPGLOSS",
      "LIPLINER",
      "BAUMES",
      "Nettoyants",
      "SOIN DE VISAGE",
      "SOIN DE CORPS",
      "SOIN DE CHEVEUX",
      "PINCEAUX DE VISAGE",
      "PINCEAUX DES YEUX",
      "PINCEAUX DES LÈVRES",
      "BRUSH CLEANSER",
      "PACK"
    ],
    // required: true,
  },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
