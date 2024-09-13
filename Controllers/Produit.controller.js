const Product = require("../Models/Produit.model");

module.exports = {
  addProduct: async (req, res) => {
    const {
      nom,
      description,
      reference,
      prix,
      solde,
      soldePourcentage,
      varient,
    } = req.body;
    if (
      !nom ||
      !description ||
      !reference ||
      !prix ||
      !solde ||
      !soldePourcentage ||
      !varient
    ) {
      return res
        .status(400)
        .json({ data: {}, message: "Tout les champs sont obligatoires" });
    }
    try {
      const response = await Product.create(req.body);
      return res
        .status(201)
        .json({ message: "Produit ajouté avec succès", data: response });
    } catch (error) {
      throw error;
    }
  },
  getProduct : async (req,res)=>{
    try {
        const response = await Product.find().sort({createdAt:-1});
        return res.status(200).json({data:response,message:"Liste des produits"});
    } catch (error) {
        console.log(error);
    }
  },
  addNewVarient : async (req,res)=>{
    const {id} = req.params;
    const {varient} = req.body;
    if(!varient){
        return res.status(400).json({message:"Veuillez remplir le champ varient"})
    }
    try {
        const response = await Product.findByIdAndUpdate(id,{$push:{varient:varient}},{new:true});
        return res.status(200).json({data:response,message:"Varient ajouté avec succès"})
    } catch (error) {
        console.log(error)
    }
  },
};
