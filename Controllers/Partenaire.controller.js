const mongoose = require("mongoose");
const Partenaire = require("../Models/Partenaire.model");

module.exports = {
  addPartenaire: async (req, res) => {
    try {
      const { nom, lien, status } = req.body;
      const logo = req.file ? req.file.path : null;

      if (!nom  || !lien || !status) {
        return res
          .status(400)
          .json({ message: "Nom, logo, lien et status sont obligatoires" });
      }
        const partenaire = new Partenaire({
          nom : nom ,
          logo : logo,
          status : status,
          lien : lien,
        
        });
        await partenaire.save();
        res.status(201).json({ message: "Partenaire ajouté avec succès", partenaire });
    
    } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
    }
   },
  getPartenaires: async (req,res)=>{
    try {
      const response = await Partenaire.find({status:true});
      return res.status(200).json({data:response,message:"Liste des partenaires"});
    } catch (error) {
      throw error
  } 
}} ; 
