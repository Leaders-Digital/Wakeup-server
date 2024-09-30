const { default: mongoose } = require("mongoose");
const Product = require("../Models/Produit.model");
const Variant = require("../Models/variant.model");
module.exports = {
  // Controller function to create a new product
  createProduct: async (req, res) => {
    try {
      const {
        nom,
        description,
        prix,
        categorie,
        subCategorie,
        solde,
        soldePourcentage,
      } = req.body;
      const mainPicture = req.file ? req.file.path : null; // Get the file path if a file was uploaded


      // Validate input
      if (
        !nom ||
        !description ||
        !prix ||
        !categorie ||
        !subCategorie ||
        !solde
      ) {
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
        subCategorie,
        solde,
        soldePourcentage,
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
      const solde = req.query.solde; // Get solde (sale) from query if provided
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const sortByPrice = req.query.sortByPrice || "desc"; // Default to sorting by price descending
      const searchArray = Array.isArray(req.query.searchArray) ? req.query.searchArray : []; // Ensure it's an array

      // Create a filter object to apply category filtering if a category is provided
      let filter = {};
      if (category && category !== "Tous les catégories") {
        filter.categorie = category;
      }

      // Add a condition to filter products that have at least one variant
      filter.variants = { $exists: true, $not: { $size: 0 } };

      // Add a condition to filter products based on the 'solde' (on sale) field, if provided
      if (solde === "true") {
        filter.solde = true;
      }

      if (search) {
        filter.$or = [
          { nom: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { categorie: { $regex: search, $options: "i" } },
          { subCategorie: { $regex: search, $options: "i" } },
        ];
      }
      if (searchArray.length > 0) {
        
        filter.subCategorie = { $in: searchArray };
      }
      let sortOption = { createdAt: -1 };
      if (sortByPrice) {
        if (sortByPrice === "asc") {
          sortOption = { prix: 1 }; // Sort by price ascending (lowest to highest)
        } else if (sortByPrice === "desc") {
          sortOption = { prix: -1 }; // Sort by price descending (highest to lowest)
        }
      }
      // Fetch products with pagination and optional category and solde filter
      const products = await Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate("variants");

      // Fetch total number of products (with the filter applied, if any)
      const totalProducts = await Product.countDocuments(filter);

      // Aggregate to find the lowest and highest prices
      const priceStats = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            lowestPrice: { $min: "$prix" },
            highestPrice: { $max: "$prix" },
          },
        },
      ]);

      const lowestPrice = priceStats.length ? priceStats[0].lowestPrice : null;
      const highestPrice = priceStats.length
        ? priceStats[0].highestPrice
        : null;

      if (!products.length) {
        return res
          .status(200)
          .json({ products: [], message: "No products found" });
      }

      // Return paginated response including the total number of products and price stats
      res.status(200).json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts,
        lowestPrice,
        highestPrice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  updateVariant: async (req, res) => {
    try {
      const { productId, variantId, quantity, color, reference, codeAbarre } =
        req.body;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID" });
      }

      // Validate variant ID
      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ message: "Invalid Variant ID" });
      }

      // Find the product by its ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Find the existing variant before updating
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Check for duplicate codeAbarre within the same product, excluding the current variant
      // const existingVariant = await Variant.findOne({
      //   codeAbarre,
      //   product: productId,
      // });
      // if (existingVariant) {
      //   return res.status(400).json({ message: "Code à barre déjà utilisé par un autre variant." });
      // }

     
      // Use existing picture and icon if no new file is uploaded
      const picture = req.files?.picture?.[0]?.path || variant.picture;
      const icon = req.files?.icon?.[0]?.path || variant.icon;
   

      // Update the variant
      const updatedVariant = await Variant.findByIdAndUpdate(
        variantId,
        {
          quantity,
          color,
          reference,
          codeAbarre,
          picture,
          icon,
        },
        { new: true } // This option returns the updated document
      );

      // Send a success response
      res.status(200).json({
        message: "Variant updated successfully",
        variant: updatedVariant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Controller function to add a variant to a product
  addVariantToProduct: async (req, res) => {
    try {
      const { productId, color, reference, codeAbarre, quantity } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      if (!quantity) {
        return res.status(400).json({ message: "Quantity is required" });
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
      const existingVariant = await Variant.findOne({ codeAbarre });
      if (existingVariant) {
        return res
          .status(400)
          .json({ message: "Variant with the same codeAbarre already exists" });
      }

      // Create the new variant
      const newVariant = new Variant({
        color,
        reference,
        codeAbarre,
        picture,
        icon,
        quantity,
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
      const product = await Product.findOne({ _id: req.params.id })
        .populate("variants")
        .populate("retings");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getAllProductsForDashboard: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default to 10 products per page
      const category = req.query.categorie; // Get category from query (if provided)
      const solde = req.query.solde; // Get solde (sale) from query if provided
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const sortByPrice = req.query.sortByPrice || "desc"; // Default to sorting by price descending

    

      // Create a filter object to apply category filtering if a category is provided
      let filter = {};
      if (category && category !== "Tous les catégories") {
        filter.categorie = category;
      }
      // Add a condition to filter products based on the 'solde' (on sale) field, if provided
      if (solde === "true") {
        filter.solde = true;
      }

      // Fetch products with pagination and optional category and solde filter
      if (search) {
        filter.$or = [
          { nom: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { categorie: { $regex: search, $options: "i" } },
          { subCategorie: { $regex: search, $options: "i" } },
        ];
      }
      let sortOption = { createdAt: -1 };
      if (sortByPrice) {
        if (sortByPrice === "asc") {
          sortOption = { prix: 1 }; // Sort by price ascending (lowest to highest)
        } else if (sortByPrice === "desc") {
          sortOption = { prix: -1 }; // Sort by price descending (highest to lowest)
        }
      }
      const products = await Product.find(filter)
        .sort(sortOption)
        // .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("variants");
      // Fetch total number of products (with the filter applied, if any)
      const totalProducts = await Product.countDocuments(filter);

      if (!products.length) {
        return res
          .status(200)
          .json({ products: [], message: "No products found" });
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

  // Controller function to delete a product by its ID
  deleteProductById: async (req, res) => {
    try {
      const { productId } = req.params;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID" });
      }

      // Find and delete the product by its ID
      const deletedProduct = await Product.findByIdAndDelete(productId);

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getProductForHomePage: async (req, res) => {
    try {
      const products = await Product.find({
        categorie: req.query.categorie,
      })
        .populate("variants")
        .limit(6);
      if (!products.length) {
        return res.status(201).json({ message: "No products found", products });
      }

      res.status(200).json({ products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Controller function to update a product
  updateProduct: async (req, res) => {
    try {
      const { productId } = req.params;
      const {
        nom,
        description,
        prix,
        categorie,
        subCategorie,
        solde,
        soldePourcentage,
      } = req.body;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID" });
      }

      // Find the product by its ID
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Handle file upload for the main picture
      const mainPicture = req.file ? req.file.path : product.mainPicture; // Use existing picture if no new file
      // Update the product fields
      product.nom = nom || product.nom;
      product.description = description || product.description;
      product.prix = prix || product.prix;
      product.categorie = categorie || product.categorie;
      product.subCategorie = subCategorie || product.subCategorie;
      product.solde = solde !== undefined ? solde : product.solde; // Allow for false solde values
      product.soldePourcentage =
        soldePourcentage !== undefined
          ? soldePourcentage
          : product.soldePourcentage;
      product.mainPicture = mainPicture;
      // Save the updated product to the database
      const updatedProduct = await product.save();
      // Send a success response
      res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getVariantById: async (req, res) => {
    try {
      const { variantId } = req.params;

      // Validate variant ID
      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ message: "Invalid Variant ID" });
      }

      // Find the variant by its ID
      const variant = await Variant.findById(variantId);

      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      res.status(200).json({ variant });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  deleteVariantById: async (req, res) => {
    try {
      const { variantId } = req.params;

      // Validate variant ID
      if (!mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ message: "Invalid Variant ID" });
      }

      // Find the variant to delete
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Find the associated product
      const productId = variant.product;

      // Delete the variant
      const deletedVariant = await Variant.findByIdAndDelete(variantId);

      // Remove the variant ID from the product's variants array
      await Product.findByIdAndUpdate(
        productId,
        { $pull: { variants: variantId } },
        { new: true }
      );

      res.status(200).json({
        message: "Variant deleted successfully",
        variant: deletedVariant,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getAllPacks: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default to 10 products per page
      const solde = req.query.solde; // Get solde (sale) from query if provided
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const sortByPrice = req.query.sortByPrice || "desc"; // Default to sorting by price descending

      // Create a filter object to apply category filtering if a category is provided
      let filter = {categorie: "PACK"};
    
      // Add a condition to filter products based on the 'solde' (on sale) field, if provided
      if (solde === "true") {
        filter.solde = true;
      }


      if (search) {
        filter.$or = [
          { nom: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { categorie: { $regex: search, $options: "i" } },
          { subCategorie: { $regex: search, $options: "i" } },
        ];
      }
      let sortOption = { createdAt: -1 };
      if (sortByPrice) {
        if (sortByPrice === "asc") {
          sortOption = { prix: 1 }; // Sort by price ascending (lowest to highest)
        } else if (sortByPrice === "desc") {
          sortOption = { prix: -1 }; // Sort by price descending (highest to lowest)
        }
      }
      // Fetch products with pagination and optional category and solde filter
      const products = await Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)

      // Fetch total number of products (with the filter applied, if any)
      const totalProducts = await Product.countDocuments(filter);

      // Aggregate to find the lowest and highest prices
      const priceStats = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            lowestPrice: { $min: "$prix" },
            highestPrice: { $max: "$prix" },
          },
        },
      ]);

      const lowestPrice = priceStats.length ? priceStats[0].lowestPrice : null;
      const highestPrice = priceStats.length
        ? priceStats[0].highestPrice
        : null;

      if (!products.length) {
        return res
          .status(200)
          .json({ products: [], message: "No Packs found" });
      }

      // Return paginated response including the total number of products and price stats
      res.status(200).json({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalProducts,
        lowestPrice,
        highestPrice,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};
