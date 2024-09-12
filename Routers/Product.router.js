const express = require('express');
const ProductRouter = express.Router();
const {addProduct} = require("../Controllers/Produit.controller")

ProductRouter.post("/addProduct",addProduct)



module.exports = ProductRouter