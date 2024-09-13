const express = require('express');
const {addProduct,getProduct} = require("../Controllers/Produit.controller")
const ProductRouter = express.Router();

// ProductRouter.post("/addProduct",addProduct)
// ProductRouter.get("/getProduct",getProduct)

module.exports = ProductRouter