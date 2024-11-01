const PromoCode = require("../Models/promoCode.model.js");
const InternUser = require("../Models/InternUser.js");
const infoData = require("../Models/info.model.js");

// Create a new promo code
const createPromoCode = async (req, res) => {
  try {
    const { code, discountValue, expirationDate } = req.body;
console.log("body",req.body);

    // Check if promo code already exists
    const existingCode = await PromoCode.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ message: "Promo code already exists" });
    }

    const newPromoCode = new PromoCode({
      code,
      discountValue,
      expirationDate,
    });

    const savedPromoCode = await newPromoCode.save();
    res.status(201).json(savedPromoCode);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: "Error creating promo code", error });
  }
};

// Get all promo codes
const getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find();
    res.status(200).json(promoCodes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching promo codes", error });
  }
};

// Get a promo code by ID
const getPromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.status(200).json(promoCode);
  } catch (error) {
    res.status(500).json({ message: "Error fetching promo code", error });
  }
};

// Update a promo code by ID
const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountValue, expirationDate, isActive } = req.body;

    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      id,
      { code, discountValue, expirationDate, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedPromoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    res.status(200).json(updatedPromoCode);
  } catch (error) {
    res.status(500).json({ message: "Error updating promo code", error });
  }
};

// Delete a promo code by ID
const deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPromoCode = await PromoCode.findByIdAndDelete(id);

    if (!deletedPromoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    res.status(200).json({ message: "Promo code deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting promo code", error });
  }
};

// Increment the timesUsed field (when a promo code is used)
const incrementTimesUsed = async (req, res) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found" });
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ message: "Promo code is inactive" });
    }

    if (new Date(promoCode.expirationDate) < new Date()) {
      return res.status(400).json({ message: "Promo code has expired" });
    }

    promoCode.timesUsed += 1;
    await promoCode.save();

    res
      .status(200)
      .json({ message: "Promo code used successfully", promoCode });
  } catch (error) {
    res.status(500).json({ message: "Error using promo code", error });
  }
};

const applyPromoCode = async (req, res) => {
  const { code } = req.body;
  try {
    let discountValue;
    // Vérifier si c'est un code promo spécifique à un stagiaire
    if (code.startsWith("WAKEUP-")) {
      const internCode = code.split("WAKEUP-")[1];
      const intern = await InternUser.findOne({ codePromo: internCode });

      // Vérifier si le code promo stagiaire est valide
      if (!intern) {
        return res.status(400).json({ message: "Code promo interne invalide" });
      }

      // Vérifier si le stagiaire a encore des tentatives restantes
      if (intern.numberOfTries <= 0) {
        return res
          .status(400)
          .json({ message: "Limite d'utilisation du code promo atteinte" });
      }

      // Diminuer le nombre de tentatives
      intern.numberOfTries -= 1;
      await intern.save();

      // Récupérer la valeur de la remise depuis le modèle infoData
      const data = await infoData.findOne({}); // Assuming there's only one document or you want the first one
      discountValue = data ? data.promo : 0; // Default to 0 if no document is found

      return res.status(200).json({
        message: "Code promo stagiaire appliqué avec succès",
        discountValue,
      });
    }

    // Si ce n'est pas un code promo stagiaire, vérifier les codes promo généraux
    const promoCode = await PromoCode.findOne({ code });
    if (!promoCode) {
      return res.status(400).json({ message: "Code promo invalide" });
    }

    // Vérifier si le code promo est actif et non expiré
    if (
      !promoCode.isActive ||
      new Date(promoCode.expirationDate) < new Date()
    ) {
      return res
        .status(400)
        .json({ message: "Le code promo est inactif ou expiré" });
    }

    // Mettre à jour l'utilisation du code promo
    promoCode.timesUsed += 1;
    await promoCode.save();

    // Récupérer la valeur de la remise
    discountValue = promoCode.discountValue;

    res.status(200).json({
      message: "Code promo appliqué avec succès",
      discountValue,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'application du code promo", error });
  }
};
module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  applyPromoCode,
  updatePromoCode,
  deletePromoCode,
  incrementTimesUsed,
};
