const Order = require("../Models/orders.model");

module.exports = {
  createOrder: async (req, res) => {
    const {
      nomPrenom,
      email,
      numTelephone,
      listeDesProduits,
      adresse,
      prixTotal,
    } = req.body;
    try {
      if (
        !nomPrenom ||
        !email ||
        !numTelephone ||
        !listeDesProduits ||
        !adresse ||
        !prixTotal
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
  getOrders : async(req,res)=>{
    try {
        const response = await Order.find(); 
        return res.status(200).json({data:response,message:"Liste des commandes"});
    } catch (error) {
        throw error
    }
  }
};
