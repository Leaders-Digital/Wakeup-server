const Order = require("../Models/orders.model");
const Variant = require("../Models/variant.model");
const mongoose = require("mongoose");

module.exports = {
  getOrdersStats: async (req, res) => {
    try {
      const today = new Date();
      const oneWeekAgo = new Date(today);
      const oneMonthAgo = new Date(today);
      
      // Set dates to the last week and last month
      oneWeekAgo.setDate(today.getDate() - 7);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      // Find orders that are "en cours"
      const enCoursOrders = await Order.find({ statut: "en cours" }).exec();

      // Find total price and count of orders with "livré" status in the last week
      const weeklyStats = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            statut: { $regex: /^livré$/i }, // Case-insensitive regex for "livré"
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalPrice: { $sum: "$prixTotal" },
          },
        },
      ]);

      // Find total price and count of orders with "livré" status in the last month
      const monthlyStats = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: oneMonthAgo },
            statut: { $regex: /^livré$/i }, // Only count orders with "livré" status
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalPrice: { $sum: "$prixTotal" },
          },
        },
      ]);

      // Find variants with quantity less than 3 and populate the associated Product
      const variantsWithLessThan3Quantity = await Variant.find({ quantity: { $lt: 3 } })
        .populate('product')
        .exec();

      // Get the last five orders with "en cours" status
      const lastFiveEnCoursOrders = await Order.find({ statut: "en cours" })
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .limit(5) // Limit to the last five orders
        .exec();

      // Send the response with the stats, variant query, and last five orders
      res.status(200).json({
        enCoursOrdersCount: enCoursOrders.length,
        weeklyStats: weeklyStats[0] || { totalOrders: 0, totalPrice: 0 },
        monthlyStats: monthlyStats[0] || { totalOrders: 0, totalPrice: 0 },
        variantsWithLessThan3Quantity,
        lastFiveEnCoursOrders,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred." });
    }
  },
};
