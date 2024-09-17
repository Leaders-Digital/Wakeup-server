const { get } = require("mongoose");
const Partenaire = require("../Models/Partenaire.model");
const Product = require("../Models/Produit.model");

module.exports = {
  addPartenaire: async (req, res) => {
    try {
      const { nom, lien, status } = req.body;
      console.log(req.file);
      
      const logo = req.file ? req.file.path : null;
      console.log(logo);
      
      if (!nom  || !lien || !status) {
        return res
          .status(400)
          .json({ message: "Nom, logo, lien et status sont obligatoires" });
      }
        const Partenaire = new Partenaire({
          nom,
          lien,
          logo,
          status,
        });
        await Product.save();
        res.status(201).json({ message: "Partenaire ajouté avec succès", Partenaire });
    
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
