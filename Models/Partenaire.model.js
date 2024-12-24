const mongoose = require("mongoose");

const partenaireSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true }, // Corresponds to "Nom Societe"
    matriculFiscal: { type: String, required: true }, // Added "Matricul Fiscal"
    telephone: { type: String, required: true }, // Already present
    email: {
      type: String,
      trim: true,
      match: [/.+\@.+\..+/, "Invalid email address"],
    }, // Added "Email"
    ville: { type: String, required: true }, // Added "Ville"
    delegation: { type: String }, // Added "Délégation"
    codePostal: { type: String }, // Added "Code Postal"
    adresse: { type: String, required: true }, // Already present, corresponds to "Adresse"
    logo: { type: String }, // Already present
    lien: { type: String, required: true }, // Already present
    status: { type: Boolean, default: false }, // Already present
    location: { type: String, required: true }, // Already present
  },
  { timestamps: true }
);

const Partenaire = mongoose.model("Partenaire", partenaireSchema);
module.exports = Partenaire;
