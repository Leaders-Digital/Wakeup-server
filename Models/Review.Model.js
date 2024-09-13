const mongoose = require('mongoose');

// Define the schema for a single review
const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  name : {type : String, required : true},
  email : {type: String, required : true}
});

// Define the schema for a review
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;