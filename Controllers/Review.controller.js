const { get } = require("mongoose");
const Review = require("../Models/Review.Model");
const Product = require("../Models/Produit.model");

module.exports = {
  addReview: async (req, res) => {
    const { rating, comment, name, email, productId } = req.body;

    
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
      const response = await Review.find().populate(
        "productId"
      );
      return res.status(200).json({ message: "Review fetched", response });
    } catch (error) {
      throw error;
    }
  },

  updateAcceptedStatus: async (req, res) => {
    const { reviewId, accepted } = req.body;

    if (!reviewId || typeof accepted !== "boolean") {
      return res.status(400).json({ message: "Invalid data" });
    }

    try {
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { accepted },
        { new: true }
      );

      if (!updatedReview) {
        return res.status(404).json({ message: "Review not found" });
      }

      return res.status(200).json({ message: "Status updated", updatedReview });
    } catch (error) {
      console.error("Error updating status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  deleteReview: async (req, res) => {
    const { reviewIds, productId } = req.body; // Get reviewIds from params
  console.log(req.body,"herererererer");
  
    if (!reviewIds || !productId) {
      return res.status(400).json({ message: "Review IDs and Product ID are required" });
    }
  
    try {
      // Find and delete reviews
      const deletedReviews = await Review.deleteMany({ _id: { $in: reviewIds } });
  
      if (deletedReviews.deletedCount === 0) {
        return res.status(404).json({ message: "No reviews found to delete" });
      }
  
      // Update the product to remove the review references
      await Product.findByIdAndUpdate(
        productId,
        {
          $pull: { ratings: { $in: reviewIds } } // Remove the review IDs from the product's ratings array
        },
        { new: true }
      );
  
      return res.status(200).json({ message: `${deletedReviews.deletedCount} review(s) deleted successfully` });
    } catch (error) {
      console.error("Error deleting reviews:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  
};
