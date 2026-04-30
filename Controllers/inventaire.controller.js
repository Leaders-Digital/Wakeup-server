const InventaireSession = require("../Models/InventaireSession");
const Variant = require("../Models/variant.model");

const createInventaireSession = async (req, res) => {
  try {
    const { sessionLabel, boxes, rows, createdBy } = req.body;

    if (!Array.isArray(boxes) || !boxes.length) {
      return res.status(400).json({ error: "boxes is required and must be a non-empty array." });
    }

    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ error: "rows is required and must be a non-empty array." });
    }

    const session = new InventaireSession({
      sessionLabel: sessionLabel || "",
      boxes,
      rows,
      createdBy: createdBy || ""
    });

    const saved = await session.save();
    return res.status(201).json({ message: "Inventaire session created.", session: saved });
  } catch (error) {
    console.error("Error creating inventaire session:", error);
    return res.status(500).json({ error: "An error occurred while creating inventaire session." });
  }
};

const getInventaireSessions = async (_req, res) => {
  try {
    const sessions = await InventaireSession.find().sort({ createdAt: -1 });
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error fetching inventaire sessions:", error);
    return res.status(500).json({ error: "An error occurred while fetching inventaire sessions." });
  }
};

const getInventaireSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await InventaireSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Inventaire session not found." });
    }
    return res.status(200).json({ session });
  } catch (error) {
    console.error("Error fetching inventaire session by id:", error);
    return res.status(500).json({ error: "An error occurred while fetching inventaire session." });
  }
};

const deleteInventaireSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await InventaireSession.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Inventaire session not found." });
    }
    return res.status(200).json({ message: "Inventaire session deleted." });
  } catch (error) {
    console.error("Error deleting inventaire session:", error);
    return res.status(500).json({ error: "An error occurred while deleting inventaire session." });
  }
};

const deleteAllInventaireSessions = async (_req, res) => {
  try {
    await InventaireSession.deleteMany({});
    return res.status(200).json({ message: "All inventaire sessions deleted." });
  } catch (error) {
    console.error("Error deleting all inventaire sessions:", error);
    return res.status(500).json({ error: "An error occurred while deleting all inventaire sessions." });
  }
};

const applySessionQuantitiesToVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await InventaireSession.findById(id).lean();

    if (!session) {
      return res.status(404).json({ error: "Inventaire session not found." });
    }

    const barcodeQtyMap = new Map();
    const rows = Array.isArray(session.rows) ? session.rows : [];

    rows.forEach((row) => {
      const barcode = String(row?.barcode || "").trim();
      if (!barcode) return;
      const qty = Number(row?.quantity) || 0;
      barcodeQtyMap.set(barcode, (barcodeQtyMap.get(barcode) || 0) + qty);
    });

    const barcodes = Array.from(barcodeQtyMap.keys());
    if (!barcodes.length) {
      return res.status(400).json({ error: "No valid barcodes found in inventaire session rows." });
    }

    const variants = await Variant.find({ codeAbarre: { $in: barcodes } }).select("_id codeAbarre quantity");
    const variantByBarcode = new Map(
      variants.map((variant) => [String(variant.codeAbarre || "").trim(), variant])
    );

    const bulkOps = [];
    let unchangedCount = 0;
    barcodes.forEach((barcode) => {
      const variant = variantByBarcode.get(barcode);
      if (!variant) return;

      const nextQty = Number(barcodeQtyMap.get(barcode)) || 0;
      const currentQty = Number(variant.quantity) || 0;
      if (currentQty === nextQty) {
        unchangedCount += 1;
        return;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: variant._id },
          update: { $set: { quantity: nextQty } }
        }
      });
    });

    if (bulkOps.length) {
      await Variant.bulkWrite(bulkOps);
    }

    const missingBarcodes = barcodes.filter((barcode) => !variantByBarcode.has(barcode));

    return res.status(200).json({
      message: "Variant quantities updated from inventaire session.",
      sessionId: id,
      totalRows: rows.length,
      uniqueBarcodes: barcodes.length,
      updatedCount: bulkOps.length,
      unchangedCount,
      missingCount: missingBarcodes.length,
      missingBarcodes
    });
  } catch (error) {
    console.error("Error applying inventaire quantities to variants:", error);
    return res.status(500).json({
      error: "An error occurred while applying inventaire quantities to variants."
    });
  }
};

module.exports = {
  createInventaireSession,
  getInventaireSessions,
  getInventaireSessionById,
  deleteInventaireSession,
  deleteAllInventaireSessions,
  applySessionQuantitiesToVariants
};
