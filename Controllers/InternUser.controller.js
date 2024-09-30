const InternUser = require("../Models/InternUser.js");
const Info = require("../Models/info.model.js");
module.exports = {
  createInternUser: async (req, res) => {
    try {
      const { nom, prenom, email, telephone, codePromo } = req.body;
      if (!nom || !prenom || !email || !codePromo) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont obligatoires" });
      }
      const user =
        (await InternUser.findOne({ email })) ||
        (await InternUser.findOne({ codePromo }));
      if (user) {
        return res.status(400).json({ message: "Cet utilisateur existe déjà" });
      }
      const interUser = new InternUser({
        nom,
        prenom,
        email,
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
      const internUser = await InternUser.find();
      res
        .status(200)
        .json({ message: "tout les untulisateur interne", data: internUser });
    } catch (error) {
      throw error;
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
  updateInternUser : async (req,res) =>{ 
    try {
        const {id} = req.params;
        const {nom, prenom, telephone} = req.body;
        const internUser = await InternUser.findByIdAndUpdate(id, {nom, prenom, telephone}, {new: true});
        if (!internUser) {
            return res.status(404).json({message: "Utilisateur introuvable"});
        }

        res.status(200).json({message: "Utilisateur modifié avec succès", data: internUser});
    } catch (error) {
       console.log(error);
       ;
    }
  },
      codePromoCheck : async (req,res) => {
        try {
          const {codePromo} = req.body;
          let UserCode = codePromo.split("-")[1]; 
          const Intern = await InternUser.findOne({codePromo : UserCode});
          if (!Intern) {
            return res.status(200).json({message: "Code promo invalide",solde:0});
          }
            if (Intern.numberOfTries === 0) {
              return res.status(200).json({message: "Vous avez atteint le nombre maximal d'essais",solde:0});
            }
            // const getSoldeFromInfo = await Info.findOne()
            res.status(200).json({message: "Code promo valide",solde:40});
            Intern.numberOfTries = Intern.numberOfTries - 1;
        } catch (error) {
          console.log(error);
          
        }
      }
};
