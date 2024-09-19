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
  mainCategorie: {
    type: String,
    enum: ["MAKE UP", "SKIN CARE", "Accessoires" ],
    required: true,
  },
  categorie: {
    type: String,
    enum: ["FACE", "Brush", "EYES", "FACE AND BODY", "BODY", "HAIR", "LIPS"],
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
