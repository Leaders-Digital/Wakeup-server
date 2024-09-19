const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    numTelephone: { type: String, required: true },
    listeDesProduits: [
      {
        variant: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" },
        quantite: { type: Number, required: true },
      },
    ], // Referencing products
    adresse: { type: String, required: true },
    gouvernorat: { type: String, required: true },
    ville: { type: String, required: true },
    codePostal: { type: String, required: true },
    note: { type: String },
    prixTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", ordersSchema);
module.exports = Order;
