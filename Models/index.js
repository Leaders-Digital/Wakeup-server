const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();
const mongoUri = process.env.Mongo_URI || process.env.MONGODB_URI;

// Helps avoid local DNS resolvers that refuse SRV queries for mongodb+srv.
const dnsServers = String(process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length) {
  dns.setServers(dnsServers);
}

const connection = mongoose
  .connect(mongoUri, {
    family: 4,
    serverSelectionTimeoutMS: 15000
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error?.message || error);
    throw error;
  });

module.exports = connection