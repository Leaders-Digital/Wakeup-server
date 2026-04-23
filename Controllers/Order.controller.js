const { default: axios } = require("axios");
const { sendOrderEmail } = require("../helpers/email");
const { sendOwnerEmail } = require("../helpers/orderMail");
const Order = require("../Models/orders.model");
const Variant = require("../Models/variant.model");
const { computeMerchandiseSubtotal } = require("../services/orderPricing.service");
const {
  checkMemberEligibility,
  normalizeCnrpsCode,
} = require("../services/cnrpsApi.service");

module.exports = {
  createOrder: async (req, res) => {
    const {
      nom,
      prenom,
      email,
      numTelephone,
      adresse,
      listeDesProduits,
      gouvernorat,
      ville,
      codePostal,
      note,
      withOffer,
      listeDesPack,
      cnrpsCode: cnrpsCodeRaw,
    } = req.body;

    try {
      if (
        !nom ||
        !prenom ||
        !email ||
        !numTelephone ||
        !adresse ||
        !gouvernorat ||
        !ville ||
        !codePostal ||
        listeDesProduits == null ||
        listeDesPack == null
      ) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }

      const listeDesProduitsArr = Array.isArray(listeDesProduits)
        ? listeDesProduits
        : [];
      const listeDesPackArr = Array.isArray(listeDesPack) ? listeDesPack : [];

      let merchandiseSubtotal;
      try {
        merchandiseSubtotal = await computeMerchandiseSubtotal(
          listeDesProduitsArr,
          listeDesPackArr
        );
      } catch (e) {
        return res.status(400).json({
          message:
            e.code === "INVALID_LINE"
              ? "Un ou plusieurs articles du panier sont invalides."
              : "Impossible de calculer le total du panier.",
        });
      }

      if (merchandiseSubtotal <= 0) {
        return res.status(400).json({
          message: "Le total des articles doit être supérieur à zéro.",
        });
      }

      let discountType = "none";
      let hasDiscount = false;
      let discountPercentApplied = 0;
      let discountAmount = 0;
      let cnrpsDiscountApplied = false;
      let cnrpsCode;
      let cnrpsCodeNormalized;
      let cnrpsEligibleAtCheckout;
      let cnrpsOneTimeConsumedByThisOrder = false;

      const cnrpsNormalized = normalizeCnrpsCode(
        cnrpsCodeRaw == null ? "" : String(cnrpsCodeRaw)
      );

      if (cnrpsNormalized) {
        const prior = await Order.findOne({
          cnrpsCodeNormalized: cnrpsNormalized,
          cnrpsDiscountApplied: true,
        });
        if (prior) {
          return res.status(400).json({
            message:
              "Ce numéro CNRPS a déjà été utilisé pour une commande avec remise.",
          });
        }

        let eligible;
        try {
          eligible = await checkMemberEligibility(cnrpsNormalized);
        } catch (e) {
          console.error("CNRPS eligibility at checkout:", e.message);
          return res.status(503).json({
            message:
              "Vérification CNRPS indisponible. Réessayez plus tard ou commandez sans remise.",
          });
        }

        if (!eligible) {
          return res.status(400).json({
            message: "Ce numéro CNRPS n'est pas éligible à la remise.",
          });
        }

        discountType = "cnrps";
        hasDiscount = true;
        discountPercentApplied = 20;
        cnrpsEligibleAtCheckout = true;
        cnrpsDiscountApplied = true;
        cnrpsOneTimeConsumedByThisOrder = true;
        cnrpsCode = cnrpsNormalized;
        cnrpsCodeNormalized = cnrpsNormalized;
        discountAmount =
          Math.round(
            merchandiseSubtotal * (discountPercentApplied / 100) * 100
          ) / 100;
      }

      const prixTotal =
        Math.round((merchandiseSubtotal - discountAmount) * 100) / 100;

      for (const item of listeDesProduitsArr) {
        const variant = await Variant.findById(item.variant);
        if (!variant) {
          return res
            .status(400)
            .json({ message: `Variant with ID ${item.variant} not found` });
        }

        if (variant.quantity < item.quantite) {
          return res.status(400).json({
            message: `Not enough stock for variant ${variant.reference}`,
          });
        }

        variant.quantity -= item.quantite;
        await variant.save();
      }

      const newOrder = new Order({
        nom,
        prenom,
        email,
        numTelephone,
        adresse,
        listeDesProduits: listeDesProduitsArr,
        listeDesPack: listeDesPackArr,
        gouvernorat,
        withOffer,
        ville,
        codePostal,
        note,
        prixTotal,
        merchandiseSubtotal,
        hasDiscount,
        discountType,
        discountPercentApplied,
        discountAmount,
        cnrpsDiscountApplied,
        cnrpsCode,
        cnrpsCodeNormalized,
        cnrpsEligibleAtCheckout,
        cnrpsOneTimeConsumedByThisOrder,
      });

      let savedOrder;
      try {
        savedOrder = await newOrder.save();
      } catch (error) {
        if (error && error.code === 11000) {
          const dupField = error.keyPattern && Object.keys(error.keyPattern)[0];
          if (dupField === "cnrpsCodeNormalized") {
            return res.status(400).json({
              message:
                "Ce numéro CNRPS a déjà été utilisé pour une commande avec remise.",
            });
          }
          return res.status(409).json({
            message: "Conflit lors de l'enregistrement. Réessayez.",
          });
        }
        throw error;
      }

      await sendOrderEmail(email, savedOrder.orderCode);
      await sendOwnerEmail({ nom, prenom, prixTotal });

      return res.status(201).json({
        message: "Commande ajoutée avec succès",
        data: savedOrder,
        orderCode: savedOrder.orderCode,
        pricing: {
          merchandiseSubtotal,
          discountType,
          hasDiscount,
          discountPercentApplied,
          discountAmount,
          prixTotal: savedOrder.prixTotal,
          cnrpsDiscountApplied: savedOrder.cnrpsDiscountApplied,
        },
      });
    } catch (error) {
      console.error("Error while creating order: ", error);
      return res.status(500).json({
        message: "Erreur serveur, veuillez réessayer plus tard.",
        error,
      });
    }
  },
  getOrders: async (req, res) => {
    try {
      // Use the $ne (not equal) operator to exclude orders with status "livré"
      const response = await Order.find({ statut: { $ne: "livré" } })
      return res
        .status(200)
        .json({ data: response, message: "Liste des commandes" });
    } catch (error) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des commandes",
        error,
      });
    }
  },
  getDeliveredOrders: async (req, res) => {
    try {
      // Filter to get only the orders with status "livré"
      const response = await Order.find({ statut: "livré" })
        .populate("listeDesProduits")
        .populate("listeDesPack.pack"); // Add this if you want to populate packs as well

      return res
        .status(200)
        .json({ data: response, message: "Liste des commandes livrées" });
    } catch (error) {
      return res.status(500).json({
        message: "Erreur lors de la récupération des commandes livrées",
        error,
      });
    }
  },
  // Controller to get order by ID and populate variants
  getOrderById: async (req, res) => {
    const { id } = req.params;
    try {
      const order = await Order.findById(id)
        .populate({
          path: "listeDesProduits.variant",
          populate: { path: "product" }, // Populate the product field in variant
        })
        .populate({
          path: "listeDesPack.pack", // Populate the pack field in listeDesPack
        });

      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Combine listeDesProduits and listeDesPack into one array
      return res.status(200).json({
        data: order,
        // Include the combined list in the response

        message: "Commande récupérée avec succès",
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la récupération de la commande" });
    }
  },
  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;

    try {
      // Find the order by ID and update the status
      const order = await Order.findByIdAndUpdate(
        id,
        { statut },
        { new: true } // Return the updated document
      );

      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      return res
        .status(200)
        .json({ message: "Statut de la commande mis à jour", data: order });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour du statut" });
    }
  },
  // Controller to get order by orderCode and populate variants and products
  getOrderByCode: async (req, res) => {
    const { orderCode } = req.params;

    try {
      const order = await Order.findOne({ orderCode }) // Query by orderCode, not _id
        .populate({
          path: "listeDesProduits.variant",
          populate: { path: "product" }, // Populate the product field in the variant
        });

      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      return res
        .status(200)
        .json({ data: order, message: "Commande récupérée avec succès" });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la récupération de la commande" });
    }
  },
  // update order payed status
  updateOrderPayed: async (req, res) => {
    const { id } = req.params;

    try {
      // Find the order by ID
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Retrieve the payment reference from the order
      const paymentRef = order.paymentRef; // Adjust according to your order schema
      console.log(order);

      if (!paymentRef) {
        return res
          .status(400)
          .json({ message: "Référence de paiement manquante" });
      }

      // Make a request to Konnect API to check payment status
      const konnectResponse = await axios.get(
        `https://api.konnect.network/api/v2/payments/${paymentRef}`,
        {
          headers: {
            "x-api-key": "672256c051a38c7f6cb8bb9d:FwrRxNCJDKERkDab8krLhZrq",
          },
        }
      );

      // Extract the payment status from the response
      const paymentStatus = konnectResponse.data.payment.status;

      // Update the order based on the payment status
      const isPayed = paymentStatus === "completed";
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { payed: isPayed },
        { new: true }
      );

      return res.status(200).json({
        message: isPayed,
        data: updatedOrder,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour du statut" });
    }
  },
  //update order paymentRef
  updateOrderPaymentRef: async (req, res) => {
    const { id } = req.params;
    const { paymentRef } = req.body;
    try {
      // Find the order by ID and update the status
      const order = await Order.findByIdAndUpdate(
        id,
        { paymentRef },
        { new: true } // Return the updated document
      );

      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      return res
        .status(200)
        .json({ message: "paymentRef de la commande mis à jour", data: order });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour du paymentRef" });
    }
  },
};
