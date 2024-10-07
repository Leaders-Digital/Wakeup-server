const Banner = require("../Models/banner.model");

const bannerController = {
  // Create a new banner
  createBanner: async (req, res) => {
    try {
      const { name } = req.body;
      const picture = req.file ? req.file.path : null; // Get the file path if a file was uploaded
      const banner = new Banner({ name, picture });
      await banner.save();
      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all banners
  getAllBanners: async (req, res) => {
    try {
      const banners = await Banner.find();
      res.status(200).json({ data: banners });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a banner by ID
  getBannerById: async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return res.status(404).json({ message: "Banner not found" });
      res.status(200).json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update a banner by ID
  updateBanner: async (req, res) => {
    try {
      const { name } = req.body;
      const picture = req.file ? req.file.path : null; // Get the file path if a file was uploaded

      const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        { name, picture },
        { new: true }
      );
      if (!banner) return res.status(404).json({ message: "Banner not found" });
      res.status(200).json(banner);
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
};

module.exports = bannerController;
