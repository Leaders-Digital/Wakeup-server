const mongoose = require('mongoose');
require('dotenv').config();
// const connection = console.log(process.env.Mongo_URI)
const connection = mongoose.connect(process.env.Mongo_URI).then(()=>{
    console.log("Database connected");
    
})

module.exports = connection