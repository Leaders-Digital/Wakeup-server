const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    nomClient: {
      type: String,
      required: true, // "Nom Client" is mandatory
      trim: true,
    },
    prenomClient: {
      type: String,
      required: true, // "Prenom Client" is mandatory
      trim: true,
    },
    tel: {
      type: String,
      trim: true, // Phone number, optional
    },
    email: {
      type: String,
      trim: true, // Email, optional
      match: [/.+\@.+\..+/, "Please enter a valid email address"], // Validates email format
    },
    ville: {
      type: String,
      trim: true, // City, optional
    },
    delegation: {
      type: String,
      trim: true, // Delegation, optional
    },
    codePostal: {
      type: String,
      trim: true, // Postal Code, optional
    },
    adresse: {
      type: String,
      trim: true, // Address, optional
    },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields

const Client = mongoose.model("Client", ClientSchema);

module.exports = Client;
