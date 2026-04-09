const mongoose = require("mongoose");

const inventaireRowSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, trim: true },
    productName: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    box: { type: String, required: true, trim: true },
    foundInDb: { type: Boolean, default: false }
  },
  { _id: false }
);

const inventaireSessionSchema = new mongoose.Schema(
  {
    sessionLabel: { type: String, default: "" },
    boxes: [{ type: String, required: true, trim: true }],
    rows: { type: [inventaireRowSchema], required: true },
    createdBy: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventaireSession", inventaireSessionSchema);
