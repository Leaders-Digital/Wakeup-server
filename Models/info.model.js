const mongoose = require("mongoose");

const infoDataSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fixNumber: { type: String },
  gsm: { type: String },
});

const infoData = mongoose.model("info", infoDataSchema);
module.exports = infoData;
