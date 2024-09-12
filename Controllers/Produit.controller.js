const product = require("../Controllers/Produit.controller");

module.exports = () => {
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
        if(!nom || !description || !reference || !prix || !solde || !soldePourcentage || !varient){
            return res.status(400).json({message:"Tout les produits champs sont obligatoires"})
        }
    try {
      const response = await product.create(req.body);
       return  res.status(201).json(response);
    } catch (error) {
      throw error;
    }
  };
};
