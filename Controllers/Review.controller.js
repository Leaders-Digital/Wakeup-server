const { get } = require("mongoose");
const Review = require("../Models/Review.Model");

module.exports = {
  addReview: async (req, res) => {
    const { rating, comment, name, email } = req.body;
    if (!rating || !comment || !name || !email) {
      return res
        .status(400)
        .json({ message: "Rating, comment, name, and email are required" });
    }

    try {
      const response = await Review.create(req.body);
      return res
        .status(201)
        .json({ message: "Review created successfully", response });
    } catch (error) {
      throw error;
    }
  },
  getReview: async (req, res) => {
    try {
      const response = await Review.find();
      return res.status(200).json({ message: "Review fetched", response });
    } catch (error) {
      throw error;
    }
  },
};
