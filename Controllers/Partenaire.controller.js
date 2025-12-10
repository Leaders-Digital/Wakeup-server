const mongoose = require("mongoose");
const Partenaire = require("../Models/Partenaire.model");
const { transformS3UrlsToSigned } = require("../helpers/s3Helper");

module.exports = {
  addPartenaire: async (req, res) => {
    try {
      const {
        nom,
        matriculFiscal,
        telephone,
        email,
        ville,
        delegation,
        codePostal,
        adresse,
        lien,
        status,
        location,
      } = req.body;

      const logo = req.file ? req.file.location : null; // Get the S3 URL if a file was uploaded
      console.log(logo);
      console.log(req.file);
      // Validate required fields
      if (!nom || !matriculFiscal || !telephone || !email || !ville || !adresse || !lien || !location) {
        return res
          .status(400)
          .json({
            message:
              "Les champs nom, matriculFiscal, telephone, email, ville, adresse, lien et location sont obligatoires",
          });
      }

      // Create the partenaire with all fields
      const partenaire = new Partenaire({
        nom,
        matriculFiscal,
        telephone,
        email,
        ville,
        delegation,
        codePostal,
        adresse,
        lien,
        status,
        location,
        logo,
      });

      // Save the partenaire to the database
      await partenaire.save();

      // Send a success response
      res.status(201).json({ message: "Partenaire ajouté avec succès", partenaire });
    } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ message: "Erreur serveur", error });
    }
  },

  getPartenaires: async (req, res) => {
    try {
      const response = await Partenaire.find();
      const partenairesWithSignedUrls = await transformS3UrlsToSigned(response, ['logo']);
      return res.status(200).json({ data: partenairesWithSignedUrls, message: "Liste des partenaires" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  },

  deletePartenaire: async (req, res) => {
    try {
      const { id } = req.params; // Get the ID from the request parameters

      // Find and delete the partenaire by ID
      const partenaire = await Partenaire.findByIdAndDelete(id);

      if (!partenaire) {
        return res.status(404).json({ message: "Partenaire non trouvé" });
      }

      // Send a success response
      res.status(200).json({ message: "Partenaire supprimé avec succès" });
    } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ message: "Erreur serveur", error });
    }
  },

  updatePartenaire: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nom,
        matriculFiscal,
        telephone,
        email,
        ville,
        delegation,
        codePostal,
        adresse,
        lien,
        status,
        location,
      } = req.body;

      // Find the existing partenaire to get the current logo
      const existingPartenaire = await Partenaire.findById(id);
      if (!existingPartenaire) {
        return res.status(404).json({ message: "Partenaire non trouvé" });
      }

      const logo = req.file ? req.file.location : existingPartenaire.logo;

      // Create an update object
      const updateData = {
        nom,
        matriculFiscal,
        telephone,
        email,
        ville,
        delegation,
        codePostal,
        adresse,
        lien,
        status,
        location,
        logo,
      };

      // Find and update the partenaire by ID
      const partenaire = await Partenaire.findByIdAndUpdate(id, updateData, { new: true });

      if (!partenaire) {
        return res.status(404).json({ message: "Partenaire non trouvé" });
      }

      // Send a success response
      res.status(200).json({ message: "Partenaire mis à jour avec succès", partenaire });
    } catch (error) {
      console.error(error); // Log the error for debugging
      res.status(500).json({ message: "Erreur serveur", error });
    }
  },
};
