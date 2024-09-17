const { get } = require("mongoose");
const Review = require("../Models/Review.Model");
const Product = require("../Models/Produit.model");

module.exports = {
  addReview: async (req, res) => {
    const { rating, comment, name, email, productId } = req.body;
    console.log(req.body);

    if (!rating || !comment || !name || !email || !productId) {
      return res
        .status(400)
        .json({ message: "Rating, comment, name, and email are required" });
    }

    const prodcut = await Product.findById(productId);
    if (!prodcut) {
      return res.status(404).json({ message: "Product not found" });
    }

    try {
      const newReveiw = await Review.create({
        rating,
        comment,
        name,
        email,
        productId,
      });
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $push: { retings: newReveiw._id }, // Add variant reference
        },
        { new: true }
      ).populate("retings"); // Populate to return variant details

      return res
        .status(201)
        .json({ message: "Review created successfully", updatedProduct });
    } catch (error) {
      throw error;
    }
  },
  getReview: async (req, res) => {
    try {
      const response = await Review.find({ accepted: "true" }).populate(
        "productId"
      );
      return res.status(200).json({ message: "Review fetched", response });
    } catch (error) {
      throw error;
    }
  },
};
