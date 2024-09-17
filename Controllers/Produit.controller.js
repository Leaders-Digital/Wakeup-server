const { default: mongoose } = require("mongoose");
const Product = require("../Models/Produit.model");
const Variant = require("../Models/variant.model");
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
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default to 10 products per page
      const category = req.query.categorie; // Get category from query (if provided)
      const skip = (page - 1) * limit;
      console.log(req.query);

      // Create a filter object to apply category filtering if a category is provided
      let filter = {};
      if (category && category !== "Tous les catégories") {
        filter.categorie = category;
      }

      // Fetch products with pagination and optional category filter
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit).populate("variants");

      // Fetch total number of products (with the filter applied, if any)
      const totalProducts = await Product.countDocuments(filter);

      if (!products.length) {
        return res.status(404).json({ message: "No products found" });
      }

      // Return paginated response including the total number of products
      res.status(200).json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts, // Include the total number of products (filtered if applicable)
      });
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
      console.log(req.body);

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID format" });
      }

      if (!reference || !codeAbarre) {
        return res
          .status(400)
          .json({ message: "Variant must have a reference and codeAbarre" });
      }

      // Handle file uploads
      const picture = req.files?.["picture"]?.[0]?.path || null;
      const icon = req.files?.["icon"]?.[0]?.path || null;

      // Check if a product with the given ID exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if a variant with the same reference already exists
      const existingVariant = await Variant.findOne({ reference });
      if (existingVariant) {
        return res
          .status(400)
          .json({ message: "Variant with the same reference already exists" });
      }

      // Create the new variant
      const newVariant = new Variant({
        color,
        reference,
        codeAbarre,
        picture,
        icon,
        product: productId, // Reference to the product
      });

      const savedVariant = await newVariant.save();

      // Update the product to include the new variant
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $push: { variants: savedVariant._id }, // Add variant reference
        },
        { new: true }
      ).populate("variants"); // Populate to return variant details

      res.status(200).json({
        message: "Variant added successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error adding variant:", error);
      res.status(500).json({ message: "Server error", error: error.message });
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

      // Calculate the total sum of all counts
      const totalCount = categoryCounts.reduce(
        (acc, category) => acc + category.count,
        0
      );

      if (!categoryCounts.length) {
        return res.status(404).json({ message: "No products found" });
      }

      res.status(200).json({
        categoryCounts: [
          { _id: "Tous les catégories", count: totalCount },
          ...categoryCounts,
        ],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getProductsByid: async (req, res) => {
    try {
      const product = await Product.findById({ _id: req.params.id })
        .populate("variants")
        .populate("retings");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ product });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};
