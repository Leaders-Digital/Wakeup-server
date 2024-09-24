const { sendOrderEmail } = require("../helpers/email");
const Order = require("../Models/orders.model");

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
    } = req.body;

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
        listeDesProduits.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }

      // Create a new order instance
      const newOrder = new Order({
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
      });

      // Save the order to the database
      const savedOrder = await newOrder.save();
      await sendOrderEmail(email, savedOrder.orderCode); // Send email with order code

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
        .json({ message: "Erreur serveur, veuillez réessayer plus tard." });
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
      const order = await Order.findById(id).populate({
        path: "listeDesProduits.variant",
        populate: { path: "product" }, // Populate the product field in variant
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
    console.log(orderCode);

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
