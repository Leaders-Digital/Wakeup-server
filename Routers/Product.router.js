const express = require("express");
const router = express.Router();
const productController = require("../Controllers/Produit.controller"); // Adjust path as needed
const { uploadFile } = require("../Middleware/imageUpload"); // Adjust path
const upload = require("../Middleware/upload");

// Middleware for handling file uploads
// Route for creating a new product
router.post(
  "/create",
  uploadFile({
    folder: "./uploads/products",
    acceptedTypes: [".png", ".jpeg", ".jpg"],
    fieldName: "mainPicture", // This should match the form field name
    multiple: false,
  }),
  productController.createProduct
);
router.post(
  "/add-variant",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "picture", maxCount: 1 },
  ]),
  productController.addVariantToProduct
);
router.get("/get-category", productController.getProductsCountByCategory);
// Route for updating a product to be on sale
router.put("/put-sale", productController.putProductOnSale);
// Route for updating a variant's quantity
router.put("/update-variant-quantity", productController.updateVariantQuantity);
// Route for getting all products on sale
router.get("/on-sale", productController.getProductsOnSale);
// Route for getting all products
router.get("/all", productController.getAllProducts);
router.get("/all/dashboard", productController.getAllProductsForDashboard);
// route for update variant
router.put(
  "/update/variant",
  upload.fields([
    { name: "icon", maxCount: 1 },
    { name: "picture", maxCount: 1 },
  ]),
  productController.updateVariant
);
// Route for getting a product by ID
router.get("/:id", productController.getProductsByid);
router.get("/crm/:id", productController.getProductsByidCRM);
// route for delete product by ID
router.delete("/:productId", productController.deleteProductById);
router.delete("/variant/:variantId", productController.deleteVariantById);
router.get("/all/home", productController.getProductForHomePage);
router.get("/get/variant/:variantId", productController.getVariantById);
router.put("/products/reset-solde", productController.resetProductSolde);

router.put(
  "/:productId",
  uploadFile({
    folder: "./uploads/products",
    acceptedTypes: [".png", ".jpeg", ".jpg"],
    fieldName: "mainPicture", // This should match the form field name
    multiple: false,
  }),
  productController.updateProduct
);
router.get("/get/packs", productController.getAllPacks);

router.put("/update/all/varients", productController.updateAllVariants);
router.put("/update/all/prices", productController.updatePrices);

module.exports = router;
