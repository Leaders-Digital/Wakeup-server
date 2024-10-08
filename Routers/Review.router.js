const express = require('express');
const reviewRouter = express.Router();
const { addReview, getReview, updateAcceptedStatus } = require('../Controllers/Review.controller');


reviewRouter.post('/add-review', addReview);
reviewRouter.get('/getReview', getReview);
reviewRouter.post('/updateAcceptedStatus',updateAcceptedStatus);

module.exports = reviewRouter;