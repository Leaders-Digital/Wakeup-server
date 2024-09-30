const Reclamation = require("../Models/Reclamation.model");

module.exports = {
  createReclamation: async (req, res) => {
    try {
      const { nom, email, telephone, message } = req.body;
      if (!nom || !email || !message) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }
      const reclamation = new Reclamation({
        nom,
        email,
        telephone,
        message,
      });
      await reclamation.save();
      res
        .status(201)
        .json({ message: "Reclamation créée avec succès", reclamation });
    } catch (error) {
      console.log(error);
    }
  },
  getReclamation: async (req, res) => {
    try {
      const result = await Reclamation.find();
      res.status(200).json({ data: result });
    } catch (error) {
      console.log(error);
    }
  },
};
