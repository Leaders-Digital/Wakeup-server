const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../Models/Produit.model');

async function check() {
  try {
    await mongoose.connect(process.env.Mongo_URI || process.env.MONGODB_URI);
    
    const count = await Product.countDocuments();
    console.log(`Total products in DB: ${count}`);
    
    const blush = await Product.findOne({ nom: 'Blush' });
    if (blush) {
      console.log(`\n"Blush" found with ID: ${blush._id}`);
      console.log(`MainPicture: ${blush.mainPicture}`);
    } else {
      console.log('\n"Blush" not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

check();

