const express = require('express');
const router = express.Router();
const productController = require('../Controllers/Produit.controller'); // Adjust path as needed

// Route to create a new product
router.post('/create', productController.createProduct);

// Route to put a product on sale
router.put('/sale', productController.putProductOnSale);

// Route to update a variant's quantity
router.put('/update-variant', productController.updateVariantQuantity);

// Route to get all products on sale
router.get('/on-sale', productController.getProductsOnSale);

// Route to get all products
router.get('/all', productController.getAllProducts);

module.exports = router;
