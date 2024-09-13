const Product = require("../Models/Produit.model"); // Adjust the path according to your project structure

// Controller function to create a new product
const createProduct = async (req, res) => {
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
};

module.exports = {
  createProduct,
};
