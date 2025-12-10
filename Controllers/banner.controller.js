const Banner = require("../Models/banner.model");
const { transformS3UrlsToSigned } = require("../helpers/s3Helper");
const { convertMongooseToPlain } = require("../helpers/mongooseHelper");

const bannerController = {
  // Create a new banner
  createBanner: async (req, res) => {
    try {
      const { name } = req.body;
      const picture = req.file ? req.file.location : null; // Get the S3 URL if a file was uploaded
      const banner = new Banner({ name, picture });
      await banner.save();
      const bannerWithSignedUrls = await transformS3UrlsToSigned(banner.toObject(), ['picture']);
      res.status(201).json(bannerWithSignedUrls);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all banners
  getAllBanners: async (req, res) => {
    try {
      const banners = await Banner.find();
      // Convert Mongoose documents to plain objects
      const bannersPlain = convertMongooseToPlain(banners);
      const bannersWithSignedUrls = await transformS3UrlsToSigned(bannersPlain, ['picture']);
      res.status(200).json({ data: bannersWithSignedUrls });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a banner by ID
  getBannerById: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return res.status(404).json({ message: "Banner not found" });
      const bannerWithSignedUrls = await transformS3UrlsToSigned(banner.toObject(), ['picture']);
      res.status(200).json(bannerWithSignedUrls);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
getBannerByname : async (req, res) => {
 try {
  const banner = await Banner.findOne({ name: req.params.name });
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  const bannerWithSignedUrls = await transformS3UrlsToSigned(banner.toObject(), ['picture']);
  res.status(200).json(bannerWithSignedUrls);
  
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
},
  // Update a banner by ID
  updateBanner: async (req, res) => {
    try {
      const { name } = req.body;
      const picture = req.file ? req.file.location : null; // Get the S3 URL if a file was uploaded

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        { name, picture },
        { new: true }
      );
      if (!banner) return res.status(404).json({ message: "Banner not found" });
      const bannerWithSignedUrls = await transformS3UrlsToSigned(banner.toObject(), ['picture']);
      res.status(200).json(bannerWithSignedUrls);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete a banner by ID
  deleteBanner: async (req, res) => {
    try {
      const banner = await Banner.findByIdAndDelete(req.params.id);
      if (!banner) return res.status(404).json({ message: "Banner not found" });
      res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // Get all banners with name as key and picture as value
getAllBannersObject: async (req, res) => {
  try {
    const banners = await Banner.find(); // Fetch all banners
    // Convert Mongoose documents to plain objects
    const bannersPlain = convertMongooseToPlain(banners);
    // Transform URLs to signed URLs first
    const bannersWithSignedUrls = await transformS3UrlsToSigned(bannersPlain, ['picture']);
    const bannerMap = {}; // Initialize an empty object

    bannersWithSignedUrls.forEach((banner) => {
      bannerMap[banner.name] = banner.picture; // Add name as key and picture as value
    });

    res.status(200).json(bannerMap); // Respond with the object
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

};

module.exports = bannerController;
