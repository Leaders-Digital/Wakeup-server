const InternUser = require("../Models/InternUser.js");
const Info = require("../Models/info.model.js");
module.exports = {
  createInternUser: async (req, res) => {
    try {
      const { nom, prenom, telephone, codePromo } = req.body;
      if (!nom || !prenom || !codePromo) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }
      const user = await InternUser.findOne({ codePromo });
      if (user) {
        return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }
      const interUser = new InternUser({
        nom,
        prenom,
        telephone,
        codePromo,
      });
      await interUser.save();
      res
        .status(201)
        .json({ message: "Utilisateur interne créé avec succès", interUser });
    } catch (error) {
      console.log(error);
    }
  },
  getInternUser: async (req, res) => {
    try {
      const { search } = req.query;

      const query = search
        ? {
            $or: [
              { nom: { $regex: search, $options: "i" } }, // Case-insensitive search
              { prenom: { $regex: search, $options: "i" } },
              { telephone: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { codePromo: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const users = await InternUser.find(query);
      res.status(200).json({ data: users });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error });
    }
  },
  deleteInternUser: async (req, res) => {
    try {
      const { id } = req.params;
      const internUser = await InternUser.findByIdAndDelete(id);
      if (!internUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      res.status(200).json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      throw error;
    }
  },
  updateInternUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, prenom, telephone } = req.body;
      const internUser = await InternUser.findByIdAndUpdate(
        id,
        { nom, prenom, telephone },
        { new: true }
      );
      if (!internUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      res
        .status(200)
        .json({ message: "Utilisateur modifié avec succès", data: internUser });
    } catch (error) {
      console.log(error);
    }
  },
  codePromoCheck: async (req, res) => {
    try {
      const { codePromo } = req.body;
      let UserCode = codePromo.split("-")[1];
      const Intern = await InternUser.findOne({ codePromo: UserCode });
      if (!Intern) {
        return res
          .status(200)
          .json({ message: "Code promo invalide", solde: 0 });
      }
      if (Intern.numberOfTries === 0) {
        return res
          .status(200)
          .json({
            message: "Vous avez atteint le nombre maximal d'essais",
            solde: 0,
          });
      }
      // const getSoldeFromInfo = await Info.findOne()
      res.status(200).json({ message: "Code promo valide", solde: 40 });
      Intern.numberOfTries = Intern.numberOfTries - 1;
    } catch (error) {
      console.log(error);
    }
  },
};
