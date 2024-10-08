const { sendOrderEmail } = require("../helpers/email");
const { sendOwnerEmail } = require("../helpers/orderMail");
const Order = require("../Models/orders.model");
const Variant = require("../Models/variant.model");

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
      prixTotal,
      listeDesPack,
    } = req.body;
    console.log(req.body);


    try {
      // Check if all required fields are present
      if (
        !nom ||
        !prenom ||
        !email ||
        !numTelephone ||
        !adresse ||
        !gouvernorat ||
        !ville ||
        !codePostal ||
        !prixTotal ||
        !listeDesProduits ||
        !listeDesPack
      ) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }

      // Loop through the products to check stock and reduce quantities
      for (const item of listeDesProduits) {
        const variant = await Variant.findById(item.variant);
        if (!variant) {
          return res
            .status(400)
            .json({ message: `Variant with ID ${item.variant} not found` });
        }

        // Check if there's enough stock
        if (variant.quantity < item.quantite) {
          return res
            .status(400)
            .json({
              message: `Not enough stock for variant ${variant.reference}`,
            });
        }

        // Reduce the stock quantity
        variant.quantity -= item.quantite;
        await variant.save(); // Save the updated variant quantity
      }

      // Create a new order instance
      const newOrder = new Order({
        nom,
        prenom,
        email,
        numTelephone,
        adresse,
        listeDesProduits,
        listeDesPack,
        gouvernorat,
        ville,
        codePostal,
        note,
        prixTotal,
      });

      // Save the order to the database
      const savedOrder = await newOrder.save();
      // await sendOrderEmail(email, savedOrder.orderCode);
      // await sendOwnerEmail({ nom, prenom, prixTotal });

      // Return the created order and the generated custom order code
      return res.status(201).json({
        message: "Commande ajoutée avec succès",
        data: savedOrder,
        orderCode: savedOrder.orderCode, // Return the custom order code
      });
    } catch (error) {
      console.error("Error while creating order: ", error);
      return res
        .status(500)
        .json({
          message: "Erreur serveur, veuillez réessayer plus tard.",
          error,
        });
    }
  },
  getOrders: async (req, res) => {
    try {
      const response = await Order.find().populate("listeDesProduits");
      return res
        .status(200)
        .json({ data: response, message: "Liste des commandes" });
    } catch (error) {
      throw error;
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
};
