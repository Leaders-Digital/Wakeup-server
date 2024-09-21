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
          .json({ message: "Tout les champs sont obligatoires" });
      }
      const response = await Order.create(req.body);
      return res
        .status(201)
        .json({ message: "Commande ajoutée avec succès", data: response });
    } catch (error) {
      console.log(error);
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
};
