const { get } = require("mongoose");
const Partenaire = require("../Models/Partenaire.model");

module.exports = {
  addPartenaire: async (req, res) => {
    const { nom, logo, lien, status } = req.body;
    if (!nom || !logo || !lien || !status) {
      return res
        .status(400)
        .json({ message: "Nom, logo, lien et status sont obligatoires" });
    }
    try {
      const response = await Partenaire.create(req.body);
      return res
        .status(201)
        .json({ message: "Partenaire ajouté avec succès", data: response });
    } catch (error) {
      throw error;
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
