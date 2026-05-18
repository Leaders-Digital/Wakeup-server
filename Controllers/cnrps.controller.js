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
          discountPercent: 25,
          minSubtotal: 0,
          description:
            "Remise de 25% pour un achat direct au comptant.",
        },
        {
          type: "compte_amicale",
          label: "Achat sur le compte de l'Amicale",
          discountPercent: 0,
          minSubtotal: 0,
          description:
            "Aucune remise pour un achat sur le compte de l'Amicale.",
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
