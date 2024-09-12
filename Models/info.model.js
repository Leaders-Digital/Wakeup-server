const mongoose = require("mongoose");

const infoDataSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fixNumber: { type: String },
  gsm: { type: String },
  whatsapp :{type:String} ,
  adresse : {type:String}, 
  facebook : {type:String}, 
  instagram: {type: String}, 
  tiktok : {type:String},
});

const infoData = mongoose.model("info", infoDataSchema);
module.exports = infoData;
