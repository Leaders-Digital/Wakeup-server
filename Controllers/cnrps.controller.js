const Order = require("../Models/orders.model");
const {
  checkMemberEligibility,
  normalizeCnrpsCode,
} = require("../services/cnrpsApi.service");

async function validateCnrpsForCart(req, res) {
  const raw = req.body?.cnrps ?? req.body?.code;
  const cnrps = normalizeCnrpsCode(raw);

  if (!cnrps) {
    return res.status(400).json({ message: "Veuillez saisir votre code CNRPS." });
  }

  try {
    const alreadyUsed = await Order.findOne({
      cnrpsCodeNormalized: cnrps,
      cnrpsDiscountApplied: true,
    }).lean();

    if (alreadyUsed) {
      return res.status(400).json({
        message:
          "Ce numéro CNRPS a déjà bénéficié de la remise unique. Vous ne pouvez pas l'utiliser à nouveau.",
        eligible: false,
      });
    }

    const eligible = await checkMemberEligibility(cnrps);
    if (!eligible) {
      return res.status(400).json({
        message: "Ce numéro CNRPS n'est pas éligible à la remise.",
        eligible: false,
      });
    }

    return res.status(200).json({
      eligible: true,
      cnrpsCode: cnrps,
      message:
        "Éligible : choisissez le type d'achat pour appliquer la remise correspondante.",
      options: [
        {
          type: "direct_comptant",
          label: "Achat direct au comptant",
          discountPercent: 20,
          minSubtotal: 0,
          description:
            "Remise de 20% pour un achat direct au comptant.",
        },
        {
          type: "compte_amicale",
          label: "Achat sur le compte de l'Amicale",
          discountPercent: 5,
          minSubtotal: 0,
          description:
            "Remise de 5% pour tout achat effectué sur le compte de l'Amicale.",
        },
      ],
    });
  } catch (err) {
    console.error("CNRPS validate error:", err.message);
    return res.status(503).json({
      message:
        "Vérification CNRPS temporairement indisponible. Réessayez plus tard ou continuez sans remise.",
      eligible: false,
    });
  }
}

module.exports = {
  validateCnrpsForCart,
};
