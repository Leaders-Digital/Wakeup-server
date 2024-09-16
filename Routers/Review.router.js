const express = require('express');
const reviewRouter = express.Router();
const { addReview, getReview } = require('../Controllers/Review.controller');


reviewRouter.post('/add-review', addReview);
reviewRouter.get('/getReview', getReview);

module.exports = reviewRouter;