const express = require("express");
const bannerController = require("../Controllers/banner.controller");
const bannerRouter = express.Router();
const { uploadFile } = require("../Middleware/imageUpload"); // Adjust path
// Create a new banner
bannerRouter.post(
  "/create",
  uploadFile({
    folder: "./uploads/banners",
    acceptedTypes: [".png", ".jpeg", ".jpg"],
    fieldName: "picture", // This should match the form field name
    multiple: false,
  }),
  bannerController.createBanner
);
bannerRouter.get("/get", bannerController.getAllBanners);
// Update a banner by ID
bannerRouter.put("/:id",
  uploadFile({
    folder: "./uploads/banners",
    acceptedTypes: [".png", ".jpeg", ".jpg"],
    fieldName: "picture", // This should match the form field name
    multiple: false,
  }), bannerController.updateBanner);


bannerRouter.get("/object", bannerController.getAllBannersObject);

// Delete a banner by ID
bannerRouter.delete("/:id", bannerController.deleteBanner);

module.exports = bannerRouter;
