const Product = require("../Models/Produit.model");
module.exports =  {
// Controller function to create a new product
createProduct : async (req, res) => {
  try {
    const { nom, description, prix, solde, soldePourcentage, variants } =
      req.body;
    
    // Validate input
    if (
      !nom ||
      !description ||
      !prix ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Product name, description, price, and at least one variant are required",
        });
    }

    // Create the product with variants
    const product = new Product({
      nom,
      description,
      prix,
      solde,
      soldePourcentage,
      variants,
    });

    // Save the product to the database
    await product.save();

    // Send a success response
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
},

// Controller function to put a product on sale
 putProductOnSale : async (req, res) => {
  try {
    const { productId, soldePourcentage } = req.body;

    if (!soldePourcentage || soldePourcentage <= 0 || soldePourcentage > 100) {
      return res.status(400).json({ message: "Invalid sale percentage" });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { solde: true, soldePourcentage },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product put on sale", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
},

// Controller function to update a variant's quantity
updateVariantQuantity : async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, "variants._id": variantId },
      { $set: { "variants.$.quantity": quantity } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product or variant not found" });
    }

    res.status(200).json({ message: "Variant quantity updated", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
},

// Controller function to get all products on sale
getProductsOnSale : async (req, res) => {
  try {
    const productsOnSale = await Product.find({ solde: true });

    if (!productsOnSale.length) {
      return res.status(404).json({ message: "No products on sale" });
    }

    res.status(200).json({ products: productsOnSale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
},

// Controller function to get all products
 getAllProducts : async (req, res) => {
  try {
    const products = await Product.find();

    if (!products.length) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
},

// Export all functions using ES6 export default


};
