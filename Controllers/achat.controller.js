const mongoose = require("mongoose");
const Achat = require("../Models/Achat");
const Variant = require("../Models/variant.model");

exports.createAchat = async (req, res) => {
  try {
    const { numFacture, products, totalPrixAchat } = req.body;

    console.log(req.body);

    // Validate required fields
    if (
      !numFacture ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !totalPrixAchat
    ) {
      return res.status(400).json({
        message:
          "Invalid data: numFacture, products, and totalPrixAchat are required",
      });
    }

    // Validate products data
    const processedProducts = products.map((product) => {
      const { variantId, quantite } = product;

      if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        throw new Error(`Invalid ObjectId: ${variantId}`);
      }

      if (!quantite || quantite <= 0) {
        throw new Error(`Invalid quantite for variantId: ${variantId}`);
      }

      return {
        variantId,
        quantite,
      };
    });

    // Create and save Achat
    const achat = new Achat({
      numFacture,
      products: processedProducts,
      totalPrixAchat, // Directly use the provided totalPrixAchat
    });

    await achat.save();

    return res
      .status(201)
      .json({ message: "Achat created successfully", achat });
  } catch (error) {
    console.error("Error creating Achat:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getAllAchats = async (req, res) => {
  try {
    const { search } = req.query; // Get the search query parameter

    let query = {};
    if (search) {
      query.numFacture = { $regex: search, $options: "i" }; // Case-insensitive regex search
    }

    const achats = await Achat.find(query).populate({
      path: "products.variantId",
      populate: {
        path: "product",
        model: "Product",
      },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Achats retrieved successfully",
      achats,
    });
  } catch (error) {
    console.error("Error retrieving Achats:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getAchatById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Achat ID" });
    }

    const achat = await Achat.findById(id).populate({
      path: "products.variantId", // Populate the variantId field
      populate: {
        path: "product", // Populate the product field within the variantId
        model: "Product", // Replace 'Product' with the actual name of your Product model
      },
    });

    if (!achat) {
      return res.status(404).json({ message: "Achat not found" });
    }

    return res.status(200).json({
      message: "Achat retrieved successfully",
      achat,
    });
  } catch (error) {
    console.error("Error retrieving Achat by ID:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.editAchat = async (req, res) => {
  try {
    const { id } = req.params; // Get the Achat ID from the route
    const { numFacture, products, totalPrixAchat } = req.body; // Get the updated data from the request body

    // Validate the Achat ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Achat ID" });
    }

    // Validate required fields
    if (
      !numFacture ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !totalPrixAchat
    ) {
      return res.status(400).json({
        message:
          "Invalid data: numFacture, products, and totalPrixAchat are required",
      });
    }

    // Validate and process products data
    const processedProducts = products.map((product) => {
      const { variantId, quantite } = product;

      if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        throw new Error(`Invalid ObjectId: ${variantId}`);
      }

      if (!quantite || quantite <= 0) {
        throw new Error(`Invalid quantite for variantId: ${variantId}`);
      }

      return {
        variantId,
        quantite,
      };
    });

    // Find the Achat by ID and update it
    const updatedAchat = await Achat.findByIdAndUpdate(
      id,
      {
        numFacture,
        products: processedProducts,
        totalPrixAchat,
      },
      { new: true } // Return the updated document
    ).populate({
      path: "products.variantId", // Populate the variantId field
      populate: {
        path: "product", // Populate the product field within the variantId
        model: "Product", // Replace 'Product' with the actual name of your Product model
      },
    });

    if (!updatedAchat) {
      return res.status(404).json({ message: "Achat not found" });
    }

    return res.status(200).json({
      message: "Achat updated successfully",
      achat: updatedAchat,
    });
  } catch (error) {
    console.error("Error updating Achat:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.validateAchat = async (req, res) => {
  try {
    const { id } = req.params; // Get the Achat ID from the route

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Achat ID" });
    }

    const achat = await Achat.findById(id);

    if (!achat) {
      return res.status(404).json({ message: "Achat not found" });
    }

    if (achat.isValidated) {
      return res.status(400).json({ message: "Achat is already validated" });
    }

    // Update variant quantities
    for (const product of achat.products) {
      const variant = await Variant.findById(product.variantId);

      if (!variant) {
        return res.status(404).json({ message: `Variant not found for ID: ${product.variantId}` });
      }

      variant.quantity += product.quantite;
      await variant.save();
    }

    achat.isValidated = true;
    await achat.save();

    return res.status(200).json({
      message: "Achat validated successfully",
      achat,
    });
  } catch (error) {
    console.error("Error validating Achat:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
