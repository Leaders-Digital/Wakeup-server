const { default: mongoose } = require("mongoose");
const Product = require("../Models/Produit.model");
const Variant = require("../Models/variant.model");
const { default: axios } = require("axios");
module.exports = {
  // Controller function to create a new product
  createProduct: async (req, res) => {
    try {
      let {
        nom,
        description,
        prix,
        categorie,
        subCategorie,
        solde,
        metaFields,
        soldePourcentage,
        prixAchat,
        prixGros,
      } = req.body;
      const mainPicture = req.file ? req.file.path : null; // Get the file path if a file was uploaded
      // Validate input
      if (!nom || !description || !prix || !categorie || !solde) {
        return res.status(400).json({
          message: "Product name, description, and price are required",
        });
      }
      if (categorie === "PACK") {
        subCategorie = "PACK";
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
        metaFields,
        prixAchat,
        prixGros,
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const subCategory = req.query.subCategory; // Correct parameter name
      const solde = req.query.solde;
      const skip = (page - 1) * limit;
      const search = req.query.search;
      const sortByPrice = req.query.sortByPrice || "desc";

      let filter = {};

      // Filter by subCategory
      if (subCategory && subCategory !== "Tous les sous-catégories") {
        filter.subCategorie = subCategory;
      }
      console.log(req.query);

      if (solde === "true") {
        filter.solde = true;
      }

      // Search conditions
      if (search) {
        filter.$or = [
          { nom: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { subCategorie: { $regex: search, $options: "i" } },
          { metaFields: { $regex: search, $options: "i" } },
        ];
      }

      // Sort options
      let sortOption = { createdAt: -1 };
      if (sortByPrice === "asc") {
        sortOption = { prix: 1 };
      } else if (sortByPrice === "desc") {
        sortOption = { prix: -1 };
      }

      console.log(filter);

      // Get products with their variant quantities and calculate enRupture status
      const products = await Product.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "variants",
            localField: "variants",
            foreignField: "_id",
            as: "variantDetails",
          },
        },
        {
          $addFields: {
            totalVariantQuantity: { $sum: "$variantDetails.quantity" },
            enRupture: {
              $cond: {
                if: { $eq: [{ $sum: "$variantDetails.quantity" }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
        { $sort: sortOption },
        { $skip: skip },
        { $limit: limit },
      ]);

      // Fetch total count of products (without quantity filtering)
      const totalProducts = await Product.countDocuments(filter);

      // Aggregate to find the lowest and highest prices for the filtered products
      const priceStats = await Product.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "variants",
            localField: "variants",
            foreignField: "_id",
            as: "variantDetails",
          },
        },
        {
          $addFields: {
            totalVariantQuantity: { $sum: "$variantDetails.quantity" },
          },
        },
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
      // Use aggregation to group by category and subcategory
      const categoryCounts = await Product.aggregate([
        {
          $match: { categorie: { $ne: "PACK" } }, // Exclude products with category 'PACK'
        },
        {
          $group: {
            _id: {
              categorie: "$categorie",
              subCategorie: "$subCategorie",
            }, // Group by both categorie and subCategorie fields
            count: { $sum: 1 }, // Count the number of products in each subcategory
          },
        },
        {
          $group: {
            _id: "$_id.categorie", // Group by category
            subcategories: {
              $push: {
                name: "$_id.subCategorie",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            category: "$_id", // Rename _id to category
            subcategories: 1,
          },
        },
      ]);

      if (!categoryCounts.length) {
        return res.status(404).json({ message: "No products found" });
      }

      res.status(200).json(categoryCounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getProductsByid: async (req, res) => {
    try {
      const productId = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await Product.findOne({ _id: productId })
        .populate({
          path: "variants",
        })
        .populate({
          path: "retings",
          match: { accepted: true },
        });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Manually filter out variants with quantity 0
      const filteredVariants = product.variants.filter(
        (variant) => variant.quantity > 0
      );

      // Calculate the total variant quantity after filtering
      const totalVariantQuantity = filteredVariants.reduce(
        (sum, variant) => sum + variant.quantity,
        0
      );
      const enRupture = totalVariantQuantity === 0;

      // Convert Mongoose document to plain object to add new fields
      const productObject = product.toObject();
      productObject.variants = filteredVariants; // Replace variants with filtered variants
      productObject.enRupture = enRupture;

      res.status(200).json(productObject);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getProductsByidCRM: async (req, res) => {
    console.log("getProductsByidCRM");
    try {
      const productId = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await Product.findOne({ _id: productId })
        .populate({
          path: "variants",
        })
        .populate({
          path: "retings",
          match: { accepted: true },
        });

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
      const category = req.query.categorie; // Get category from query (if provided)
      const solde = req.query.solde; // Get solde (sale) from query if provided
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
        // totalPages: Math.ceil(totalProducts / limit),
        // currentPage: page,
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
      // Use an aggregation pipeline
      const pipeline = [
        // 1) Match the category
        {
          $match: {
            categorie: req.query.categorie,
          },
        },
        // 2) Lookup (populate) the variants
        {
          $lookup: {
            from: "variants", // Collection name for your Variant model
            localField: "variants", // Field in Product
            foreignField: "_id", // Field in Variant
            as: "variantDetails", // The resulting array
          },
        },
        // 3) Calculate sum of all variant quantities
        {
          $addFields: {
            totalVariantQuantity: { $sum: "$variantDetails.quantity" },
          },
        },
        // 4) Keep only products whose totalVariantQuantity is > 0
        {
          $match: {
            totalVariantQuantity: { $gt: 0 },
          },
        },
        // 5) Limit to first 6
        { $limit: 6 },
      ];

      const products = await Product.aggregate(pipeline);

      // If nothing is found
      if (!products.length) {
        return res.status(201).json({ message: "No products found", products });
      }

      // products now each have variantDetails (instead of "variants")
      // which includes the actual variant documents from the aggregation.

      // If needed, you can further filter out zero-quantity variants or
      // mark `enRupture` exactly like before:
      const modifiedProducts = products.map((product) => {
        const filteredVariants = product.variantDetails.filter(
          (variant) => variant.quantity > 0
        );
        const totalVariantQuantity = filteredVariants.reduce(
          (sum, variant) => sum + variant.quantity,
          0
        );
        const enRupture = totalVariantQuantity === 0;

        return {
          ...product,
          variantDetails: filteredVariants,
          enRupture,
        };
      });

      return res.status(200).json({ products: modifiedProducts });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
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
        metaFields,
        prixAchat,
        prixGros,
      } = req.body;
      console.log(req.body);

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
      product.metaFields = metaFields || product.metaFields;
      product.categorie = categorie || product.categorie;
      product.subCategorie = subCategorie || product.subCategorie;
      product.solde = solde !== undefined ? solde : product.solde; // Allow for false solde values
      product.soldePourcentage =
        soldePourcentage !== undefined
          ? soldePourcentage
          : product.soldePourcentage;
      product.mainPicture = mainPicture;
      product.prixAchat = prixAchat || product.prixAchat;
      product.prixGros = prixGros || product.prixGros;
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
      let filter = { categorie: "PACK" };

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
        .limit(limit);

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
  updateAllVariants: async (req, res) => {
    try {
      const variants = await Variant.find();
      console.log("Total Variants:", variants.length);

      const config = {
        headers: {
          Authorization: "jkaAVXs852ZPOnlop795",
          "Content-Type": "application/json",
        },
      };

      let updatedCount = 0; // Track updated products
      let unrecognizedCount = 0; // Track products not recognized by the API

      // Use a for...of loop with async/await for sequential processing
      for (const [index, variant] of variants.entries()) {
        const body = {
          code: variant.codeAbarre,
        };

        try {
          const response = await axios.post(
            "https://expert.leaders-immo.com/api/makeup/article/stock",
            body,
            config
          );

          const { resultat, status } = response.data;
          if (status === "success") {
            if (variant.quantity !== resultat) {
              // Update quantity if it differs
              variant.quantity = resultat;
              await variant.save();
              updatedCount++;
              console.log(
                `Updated variant at index ${index} (${variant.codeAbarre}): New quantity is ${resultat}`
              );
            } else {
              console.log(
                `Same quantity for variant at index ${index} (${variant.codeAbarre}): Quantity is ${resultat}`
              );
            }
          } else {
            // Handle unrecognized products
            console.log(
              `API did not recognize variant at index ${index} (${variant.codeAbarre})`
            );
            unrecognizedCount++;
          }
        } catch (error) {
          console.error(
            `Error for variant at index ${index} (${variant.codeAbarre}):`,
            error
          );
          unrecognizedCount++;
        }
      }

      res.json({
        message: "Variants updated successfully",
        totalVariants: variants.length,
        updatedCount,
        unrecognizedCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  updatePrices: async (req, res) => {
    try {
      const variants = await Variant.find();
      console.log("Total Variants:", variants.length);

      const uniqueVariants = [];
      const seenProducts = new Set();

      for (const variant of variants) {
        const product = await Product.findOne({ variants: variant._id });
        if (!seenProducts.has(product.nom)) {
          seenProducts.add(product.nom);
          uniqueVariants.push(variant);
        }
      }

      const config = {
        headers: {
          Authorization: "jkaAVXs852ZPOnlop795",
          "Content-Type": "application/json",
        },
      };

      for (const [index, variant] of uniqueVariants.entries()) {
        const body = {
          code: variant.codeAbarre,
        };
        try {
          const response = await axios.post(
            "https://expert.leaders-immo.com/api/makeup/article/price",
            body,
            config
          );
          const newPrice = response.data.resultat;

          const product = await Product.findOneAndUpdate(
            { variants: variant._id },
            { $set: { prix: newPrice } },
            { new: true }
          );

          console.log(
            `Updated price for ${product.nom} (${variant.codeAbarre}):`,
            product.prix
          );
        } catch (error) {
          console.error(
            `Error for variant at index ${index} (${variant.codeAbarre}):`,
            error.message
          );
        }
      }
      return res.json({ msg: "done" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  resetProductSolde: async (req, res) => {
    try {
      const result = await Product.updateMany(
        {},
        { solde: false, soldePourcentage: 0 }
      );
      res.status(200).json({
        message: "All products updated successfully",
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Error updating products:", error);
      res.status(500).json({ message: "Failed to update products", error });
    }
  },
};
