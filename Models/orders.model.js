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
    /** Merchandise subtotal from DB prices before any order-level discount (excludes shipping). */
    merchandiseSubtotal: { type: Number },
    hasDiscount: { type: Boolean, default: false },
    discountType: {
      type: String,
      enum: ["none", "cnrps"],
      default: "none",
    },
    discountPercentApplied: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    /** Raw / normalized CNRPS identifier stored when a CNRPS discount is applied. */
    cnrpsCode: { type: String },
    cnrpsCodeNormalized: { type: String },
    /**
     * Which CNRPS purchase channel was selected by the buyer:
     *  - direct_comptant : achat direct au comptant (25%)
     *  - compte_amicale  : achat sur le compte de l'Amicale (10%)
     */
    cnrpsPurchaseType: {
      type: String,
      enum: ["direct_comptant", "compte_amicale", null],
      default: null,
    },
    /** True when this order received a CNRPS percentage discount (direct au comptant). */
    cnrpsDiscountApplied: { type: Boolean, default: false },
    /** Snapshot: external eligibility API returned true at order creation. */
    cnrpsEligibleAtCheckout: { type: Boolean },
    /** @deprecated Legacy flag; remise CNRPS is no longer limited to one order per number. */
    cnrpsOneTimeConsumedByThisOrder: { type: Boolean, default: false },
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

/** Remove legacy one-CNRPS-per-number unique index if it still exists in MongoDB. */
async function dropLegacyCnrpsUniqueIndex() {
  try {
    await Order.collection.dropIndex("cnrpsCodeNormalized_1");
    console.log("[Order] Dropped legacy unique CNRPS index (cnrpsCodeNormalized_1)");
  } catch (err) {
    const missing =
      err?.code === 27 || /index not found|ns not found/i.test(String(err?.message));
    if (!missing) {
      console.warn("[Order] Could not drop legacy CNRPS index:", err.message);
    }
  }
}

if (mongoose.connection.readyState === 1) {
  dropLegacyCnrpsUniqueIndex();
} else {
  mongoose.connection.once("open", dropLegacyCnrpsUniqueIndex);
}

module.exports = Order;
