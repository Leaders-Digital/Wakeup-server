const Reclamation = require("../Models/Reclamation.model");

module.exports = {
  createReclamation: async (req, res) => {
    try {
      const { nom, email, message,telephone } = req.body;
      if (!nom || !email || !message || !telephone) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }
      const reclamation = new Reclamation({
        nom,
        email,
        message,
        telephone
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
      const result = await Reclamation.find().sort({ createdAt: -1 });
      res.status(200).json({ data: result });
    } catch (error) {
      console.log(error);
    }
  },
  updateReclamationStatus : async (req, res) => {
    try {
      const { id } = req.params;
      const { etat } = req.body;
      const reclamation = await Reclamation.findByIdAndUpdate(id, { etat }, { new: true });
        if (!reclamation) {
            return res.status(404).json({ message: "Reclamation introuvable" });
        }
        res.status(200).json({ message: "Reclamation mise à jour avec succès", reclamation });
    } catch (error) {
        console.log(error);
    }
  }
};
