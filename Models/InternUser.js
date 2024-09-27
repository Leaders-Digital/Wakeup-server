const mongoose = require("mongoose");

const InternUserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
    },
    prenom: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    telephone: {
      type: String,
    },
    codePromo: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const InternUser = mongoose.model("InternUser", InternUserSchema);
module.exports = InternUser;
