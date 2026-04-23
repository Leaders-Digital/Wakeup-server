const Variant = require("../Models/variant.model");
const Product = require("../Models/Produit.model");

function unitPriceFromProduct(product) {
  if (!product) return null;
  const base = Number(product.prix);
  if (Number.isNaN(base)) return null;
  if (product.solde && product.soldePourcentage != null) {
    const pct = Number(product.soldePourcentage);
    return base - (base * pct) / 100;
  }
  return base;
}

/**
 * Computes merchandise subtotal from DB prices (variants + packs). Does not include shipping.
 */
async function computeMerchandiseSubtotal(listeDesProduits = [], listeDesPack = []) {
  let sum = 0;

  for (const item of listeDesProduits) {
    const variant = await Variant.findById(item.variant).populate("product");
    if (!variant || !variant.product) {
      const err = new Error(`Variant ${item.variant} not found or missing product`);
      err.code = "INVALID_LINE";
      throw err;
    }
    const unit = unitPriceFromProduct(variant.product);
    if (unit == null) {
      const err = new Error(`Invalid price for variant ${item.variant}`);
      err.code = "INVALID_LINE";
      throw err;
    }
    sum += unit * Number(item.quantite);
  }

  for (const item of listeDesPack) {
    const pack = await Product.findById(item.pack);
    if (!pack) {
      const err = new Error(`Pack/product ${item.pack} not found`);
      err.code = "INVALID_LINE";
      throw err;
    }
    const unit = unitPriceFromProduct(pack);
    if (unit == null) {
      const err = new Error(`Invalid price for pack ${item.pack}`);
      err.code = "INVALID_LINE";
      throw err;
    }
    sum += unit * Number(item.quantite);
  }

  return Math.round(sum * 100) / 100;
}

module.exports = {
  computeMerchandiseSubtotal,
  unitPriceFromProduct,
};
