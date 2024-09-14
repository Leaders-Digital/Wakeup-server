const Product = require("../Models/Produit.model");
module.exports = {
  // Controller function to create a new product
  createProduct: async (req, res) => {
    try {
      const { nom, description, prix, categorie } = req.body;
      const mainPicture = req.file ? req.file.path : null; // Get the file path if a file was uploaded
      console.log(req.file);

      // Validate input
      if (!nom || !description || !prix || !categorie) {
        return res.status(400).json({
          message: "Product name, description, and price are required",
        });
      }

      // Create the product with the main image
      const product = new Product({
        nom,
        description,
        prix,
        categorie,
        mainPicture,
      });

      // Save the product to the database
      await product.save();

      // Send a success response
      res
        .status(201)
        .json({ message: "Product created successfully", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Controller function to put a product on sale
  putProductOnSale: async (req, res) => {
    try {
      const { productId, soldePourcentage } = req.body;

      if (
        !soldePourcentage ||
        soldePourcentage <= 0 ||
        soldePourcentage > 100
      ) {
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
  updateVariantQuantity: async (req, res) => {
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
        return res
          .status(404)
          .json({ message: "Product or variant not found" });
      }

      res.status(200).json({ message: "Variant quantity updated", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Controller function to get all products on sale
  getProductsOnSale: async (req, res) => {
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
  getAllProducts: async (req, res) => {
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
  updateVariantDetails: async (req, res) => {
    try {
      const { productId, variantId, updateData } = req.body;

      // Validate input
      if (!productId || !variantId || !updateData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Update variant details
      const product = await Product.findOneAndUpdate(
        { _id: productId, "variants._id": variantId },
        { $set: { "variants.$": updateData } },
        { new: true }
      );

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product or variant not found" });
      }

      res.status(200).json({ message: "Variant details updated", product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Controller function to add a variant to a product
  addVariantToProduct: async (req, res) => {
    try {
      const { productId, color, reference, codeAbarre } = req.body;

      // Validate input
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // Ensure variantData is an object with necessary fields
      if (!reference || !codeAbarre) {
        return res
          .status(400)
          .json({ message: "Variant must have a reference and codeAbarre" });
      }

      // Handle file uploads
      const picture = req.files["picture"]
        ? req.files["picture"][0].path
        : null;
      const icon = req.files["icon"] ? req.files["icon"][0].path : null;

      // Check if a variant with the same reference already exists
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const existingVariant = product.variants.find(
        (variant) => variant.reference === reference
      );

      if (existingVariant) {
        return res
          .status(400)
          .json({ message: "Variant with the same reference already exists" });
      }

      // Find the product and update it by pushing the new variant
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $push: { variants: { color, reference, codeAbarre, picture, icon } },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Variant added successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Export all functions using ES6 export default
  // Controller function to get the count of products in each category
  getProductsCountByCategory: async (req, res) => {
    try {
      // Use aggregation to group by category and count the products in each one
      const categoryCounts = await Product.aggregate([
        {
          $group: {
            _id: "$categorie", // Group by category field
            count: { $sum: 1 }, // Count the number of products in each category
          },
        },
        {
          $sort: { count: -1 }, // Optional: sort by count in descending order
        },
      ]);

      if (!categoryCounts.length) {
        return res.status(404).json({ message: "No products found" });
      }

      res.status(200).json({ categoryCounts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};
