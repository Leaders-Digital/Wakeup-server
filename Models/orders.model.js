const mongoose = require("mongoose");

// Helper function to generate the custom order code
function generateOrderCode() {
  const prefix = "WAKE-UP"; // Static prefix
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
  const suffix = Math.floor(10 + Math.random() * 90); // Random 2-digit suffix
  return `${prefix}-${randomNumber}_${suffix}`;
}

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
    ],
    listeDesPack: [
      {
        pack: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantite: { type: Number, required: true },
      },
    ],
    adresse: { type: String, required: true },
    gouvernorat: { type: String, required: true },
    ville: { type: String, required: true },
    codePostal: { type: String, required: true },
    note: { type: String },
    prixTotal: { type: Number, required: true },
    statut: {
      type: String,
      enum: ["en cours", "validé", "annulé", "livré"],
      default: "en cours",
    },
    withOffer: { type: Boolean, default: false },
    payed: { type: Boolean, default: false },
    orderCode: { type: String, unique: true }, // Unique order code field
    paymentRef: { type: String, unique: true },
  },
  { timestamps: true }
);

// Pre-save hook to generate the custom orderCode
ordersSchema.pre("save", function (next) {
  if (!this.orderCode) {
    this.orderCode = generateOrderCode(); // Generate custom order code
  }
  next();
});

const Order = mongoose.model("Order", ordersSchema);
module.exports = Order;
