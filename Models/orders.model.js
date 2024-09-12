const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  nomPrenom: { type: String, required: true },
  email: { type: String, required: true },
  numTelephone: { type: String, required: true },
  listeDesProduits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Referencing products
  adresse: { type: String, required: true },
  quantite: { type: Number, required: true },
  prixTotal: { type: Number, required: true },
  livre: { type: Boolean, default: false },
});

const Order = mongoose.model("Order", ordersSchema);
module.exports = Order;
