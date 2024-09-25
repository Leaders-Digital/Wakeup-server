const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a single variant
const variantSchema = new Schema({
  quantity: { type: Number },
  picture: { type: String },
  color: { type: String },
  icon: { type: String },
  reference: { type: String, required: true },
  codeAbarre: { type: String, unique: true, sparse: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
}, { timestamps: true });

const Variant = mongoose.model('Variant', variantSchema);
module.exports = Variant;
