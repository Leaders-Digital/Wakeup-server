const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  nomPrenom: { type: String, required: true },
  email: { type: String, required: true },
  numTelephone: { type: String, required: true },
  listeDesProduits: [
    {
      prodcut: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantite: { type: Number, required: true },
    },
  ], // Referencing products
  adresse: { type: String, required: true },
  prixTotal: { type: Number, required: true },
});

const Order = mongoose.model("Order", ordersSchema);
module.exports = Order;
