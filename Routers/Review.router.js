const express = require('express');
const reviewRouter = express.Router();
const { addReview, getReview, updateAcceptedStatus,deleteReview } = require('../Controllers/Review.controller');


reviewRouter.post('/add-review', addReview);
reviewRouter.get('/getReview', getReview);
reviewRouter.delete("/deleteReview",deleteReview);
reviewRouter.post('/updateAcceptedStatus',updateAcceptedStatus);

module.exports = reviewRouter;